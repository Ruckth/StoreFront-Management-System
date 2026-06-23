from django.db import transaction
from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Cart, CartItem, Order, OrderItem
from orders.permissions import IsBuyer
from orders.serializers import (
    AddCartItemSerializer,
    CartItemSerializer,
    CartSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    UpdateCartItemSerializer,
)
from products.models import Product


class ActiveCartView(APIView):
    permission_classes = (IsBuyer,)

    def get(self, request):
        cart = get_active_cart(request.user)
        return Response(CartSerializer(cart, context={"request": request}).data)


class CartItemCreateView(generics.CreateAPIView):
    permission_classes = (IsBuyer,)
    serializer_class = AddCartItemSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["cart"] = get_active_cart(self.request.user)
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        return Response(
            CartItemSerializer(item, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class CartItemDetailView(generics.GenericAPIView):
    permission_classes = (IsBuyer,)
    serializer_class = CartItemSerializer

    def get_queryset(self):
        return CartItem.objects.select_related("cart", "product").filter(
            cart__buyer=self.request.user,
            cart__status=Cart.Status.ACTIVE,
        )

    def patch(self, request, *args, **kwargs):
        item = self.get_object()
        serializer = UpdateCartItemSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            CartItemSerializer(item, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, *args, **kwargs):
        item = self.get_object()
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CheckoutView(APIView):
    permission_classes = (IsBuyer,)

    def post(self, request):
        with transaction.atomic():
            cart = (
                Cart.objects.select_for_update()
                .filter(buyer=request.user, status=Cart.Status.ACTIVE)
                .first()
            )
            if not cart:
                return Response(
                    {"detail": "Cart is empty."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            cart_items = list(cart.items.select_related("product"))
            if not cart_items:
                return Response(
                    {"detail": "Cart is empty."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            product_ids = [item.product_id for item in cart_items]
            products = {
                product.id: product
                for product in Product.objects.select_for_update().filter(id__in=product_ids)
            }

            for item in cart_items:
                product = products[item.product_id]
                if item.quantity > product.available_quantity:
                    return Response(
                        {
                            "detail": (
                                f"Insufficient stock for {product.title}. "
                                f"Only {product.available_quantity} available."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            order = Order.objects.create(buyer=request.user, total_price=cart.total_price)
            order_items = []

            for item in cart_items:
                product = products[item.product_id]
                order_items.append(
                    OrderItem(
                        order=order,
                        product=product,
                        product_title_snapshot=product.title,
                        unit_price_snapshot=product.unit_price,
                        quantity=item.quantity,
                    )
                )
                product.available_quantity -= item.quantity

            OrderItem.objects.bulk_create(order_items)
            Product.objects.bulk_update(products.values(), ("available_quantity",))
            cart.status = Cart.Status.CHECKED_OUT
            cart.save(update_fields=("status", "updated_at"))

        order = Order.objects.prefetch_related("items").get(id=order.id)
        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (IsBuyer,)

    def get_queryset(self):
        return (
            Order.objects.filter(buyer=self.request.user)
            .prefetch_related("items")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action == "list":
            return OrderListSerializer
        return OrderDetailSerializer


def get_active_cart(user):
    cart, _created = Cart.objects.prefetch_related("items__product").get_or_create(
        buyer=user,
        status=Cart.Status.ACTIVE,
    )
    return cart
