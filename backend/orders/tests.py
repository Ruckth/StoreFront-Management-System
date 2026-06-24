from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from orders.models import Cart, CartItem, Order
from products.models import Product
from users.models import User


def image_url(name="product.jpg"):
    return f"https://utfs.io/f/{name}"


class CartOrderAPITests(APITestCase):
    def setUp(self):
        self.seller = User.objects.create_user(
            email="seller@example.com",
            password="StrongPassword123",
            role=User.Role.SELLER,
        )
        self.buyer = User.objects.create_user(
            email="buyer@example.com",
            password="StrongPassword123",
            role=User.Role.BUYER,
        )
        self.other_buyer = User.objects.create_user(
            email="other-buyer@example.com",
            password="StrongPassword123",
            role=User.Role.BUYER,
        )
        self.product = Product.objects.create(
            seller=self.seller,
            image=image_url(),
            title="Notebook",
            description="A5 dotted notebook",
            unit_price=Decimal("129.00"),
            available_quantity=10,
        )

    def authenticate_buyer(self):
        self.client.force_authenticate(self.buyer)

    def add_item(self, product=None, quantity=2):
        product = product or self.product
        cart = Cart.objects.create(buyer=self.buyer)
        return CartItem.objects.create(cart=cart, product=product, quantity=quantity)

    def test_buyer_can_get_active_cart(self):
        self.authenticate_buyer()

        response = self.client.get(reverse("cart-active"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "active")
        self.assertEqual(response.data["items"], [])
        self.assertTrue(Cart.objects.filter(buyer=self.buyer, status="active").exists())

    def test_buyer_can_add_item_to_cart(self):
        self.authenticate_buyer()

        response = self.client.post(
            reverse("cart-item-list"),
            {"product_id": self.product.id, "quantity": 2},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["quantity"], 2)
        self.assertEqual(response.data["line_total"], "258.00")

    def test_duplicate_add_increments_existing_cart_item(self):
        self.authenticate_buyer()

        for _ in range(2):
            response = self.client.post(
                reverse("cart-item-list"),
                {"product_id": self.product.id, "quantity": 2},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CartItem.objects.count(), 1)
        self.assertEqual(CartItem.objects.get().quantity, 4)

    def test_duplicate_add_cannot_exceed_available_stock(self):
        self.authenticate_buyer()
        self.client.post(
            reverse("cart-item-list"),
            {"product_id": self.product.id, "quantity": 8},
            format="json",
        )

        response = self.client.post(
            reverse("cart-item-list"),
            {"product_id": self.product.id, "quantity": 3},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantity", response.data)
        self.assertEqual(CartItem.objects.get().quantity, 8)

    def test_cart_item_quantity_must_be_positive(self):
        self.authenticate_buyer()

        response = self.client.post(
            reverse("cart-item-list"),
            {"product_id": self.product.id, "quantity": 0},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantity", response.data)

    def test_cart_item_quantity_cannot_be_negative(self):
        self.authenticate_buyer()

        response = self.client.post(
            reverse("cart-item-list"),
            {"product_id": self.product.id, "quantity": -1},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantity", response.data)

    def test_cart_item_quantity_cannot_exceed_stock(self):
        self.authenticate_buyer()

        response = self.client.post(
            reverse("cart-item-list"),
            {"product_id": self.product.id, "quantity": 11},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantity", response.data)

    def test_buyer_can_update_cart_item_quantity(self):
        item = self.add_item(quantity=2)
        self.authenticate_buyer()

        response = self.client.patch(
            reverse("cart-item-detail", args=[item.id]),
            {"quantity": 3},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["quantity"], 3)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 3)

    def test_buyer_cannot_update_cart_item_to_zero_or_over_stock(self):
        item = self.add_item(quantity=2)
        self.authenticate_buyer()

        zero_response = self.client.patch(
            reverse("cart-item-detail", args=[item.id]),
            {"quantity": 0},
            format="json",
        )
        over_stock_response = self.client.patch(
            reverse("cart-item-detail", args=[item.id]),
            {"quantity": 11},
            format="json",
        )

        self.assertEqual(zero_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(over_stock_response.status_code, status.HTTP_400_BAD_REQUEST)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 2)

    def test_buyer_cannot_update_cart_item_to_negative_quantity(self):
        item = self.add_item(quantity=2)
        self.authenticate_buyer()

        response = self.client.patch(
            reverse("cart-item-detail", args=[item.id]),
            {"quantity": -1},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantity", response.data)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 2)

    def test_buyer_can_remove_cart_item(self):
        item = self.add_item(quantity=2)
        self.authenticate_buyer()

        response = self.client.delete(reverse("cart-item-detail", args=[item.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CartItem.objects.filter(id=item.id).exists())

    def test_buyer_cannot_manage_another_buyers_cart_item(self):
        other_cart = Cart.objects.create(buyer=self.other_buyer)
        item = CartItem.objects.create(cart=other_cart, product=self.product, quantity=1)
        self.authenticate_buyer()

        response = self.client.patch(
            reverse("cart-item-detail", args=[item.id]),
            {"quantity": 2},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_seller_cannot_read_or_mutate_cart_items(self):
        item = self.add_item(quantity=2)
        self.client.force_authenticate(self.seller)

        cart_response = self.client.get(reverse("cart-active"))
        update_response = self.client.patch(
            reverse("cart-item-detail", args=[item.id]),
            {"quantity": 1},
            format="json",
        )
        delete_response = self.client.delete(reverse("cart-item-detail", args=[item.id]))

        self.assertEqual(cart_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(update_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 2)

    def test_seller_cannot_add_to_cart_or_checkout(self):
        self.client.force_authenticate(self.seller)

        add_response = self.client.post(
            reverse("cart-item-list"),
            {"product_id": self.product.id, "quantity": 1},
            format="json",
        )
        checkout_response = self.client.post(reverse("cart-checkout"), {}, format="json")

        self.assertEqual(add_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(checkout_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_user_cannot_access_or_mutate_cart(self):
        item = self.add_item(quantity=2)

        cart_response = self.client.get(reverse("cart-active"))
        add_response = self.client.post(
            reverse("cart-item-list"),
            {"product_id": self.product.id, "quantity": 1},
            format="json",
        )
        update_response = self.client.patch(
            reverse("cart-item-detail", args=[item.id]),
            {"quantity": 1},
            format="json",
        )
        delete_response = self.client.delete(reverse("cart-item-detail", args=[item.id]))
        checkout_response = self.client.post(reverse("cart-checkout"), {}, format="json")

        self.assertEqual(cart_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(add_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(update_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(delete_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(checkout_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_checkout_creates_order_reduces_stock_and_closes_cart(self):
        item = self.add_item(quantity=2)
        self.authenticate_buyer()

        response = self.client.post(reverse("cart-checkout"), {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["total_price"], "258.00")
        self.assertEqual(response.data["items"][0]["product_title_snapshot"], "Notebook")
        self.product.refresh_from_db()
        item.cart.refresh_from_db()
        self.assertEqual(self.product.available_quantity, 8)
        self.assertEqual(item.cart.status, Cart.Status.CHECKED_OUT)
        self.assertEqual(Order.objects.count(), 1)

    def test_checkout_rejects_empty_cart(self):
        Cart.objects.create(buyer=self.buyer)
        self.authenticate_buyer()

        response = self.client.post(reverse("cart-checkout"), {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("empty", response.data["detail"].lower())

    def test_checkout_rejects_insufficient_stock_without_reducing_inventory(self):
        self.add_item(quantity=5)
        self.product.available_quantity = 3
        self.product.save(update_fields=("available_quantity",))
        self.authenticate_buyer()

        response = self.client.post(reverse("cart-checkout"), {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.product.refresh_from_db()
        self.assertEqual(self.product.available_quantity, 3)
        self.assertEqual(Order.objects.count(), 0)

    def test_checkout_insufficient_stock_does_not_partially_reduce_inventory(self):
        second_product = Product.objects.create(
            seller=self.seller,
            image=image_url("second-product.jpg"),
            title="Pen",
            description="Blue ink pen",
            unit_price=Decimal("20.00"),
            available_quantity=1,
        )
        cart = Cart.objects.create(buyer=self.buyer)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)
        CartItem.objects.create(cart=cart, product=second_product, quantity=1)
        second_product.available_quantity = 0
        second_product.save(update_fields=("available_quantity",))
        self.authenticate_buyer()

        response = self.client.post(reverse("cart-checkout"), {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Insufficient stock", response.data["detail"])
        self.product.refresh_from_db()
        second_product.refresh_from_db()
        cart.refresh_from_db()
        self.assertEqual(self.product.available_quantity, 10)
        self.assertEqual(second_product.available_quantity, 0)
        self.assertEqual(cart.status, Cart.Status.ACTIVE)
        self.assertEqual(Order.objects.count(), 0)

    def test_order_snapshots_remain_stable_after_product_edit(self):
        self.add_item(quantity=1)
        self.authenticate_buyer()
        checkout_response = self.client.post(reverse("cart-checkout"), {}, format="json")

        self.product.title = "Updated Notebook"
        self.product.unit_price = Decimal("199.00")
        self.product.save(update_fields=("title", "unit_price"))
        detail_response = self.client.get(
            reverse("order-detail", args=[checkout_response.data["id"]])
        )

        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        item = detail_response.data["items"][0]
        self.assertEqual(item["product_title_snapshot"], "Notebook")
        self.assertEqual(item["unit_price_snapshot"], "129.00")

    def test_buyer_can_only_see_own_orders(self):
        own_order = Order.objects.create(buyer=self.buyer, total_price=Decimal("1.00"))
        Order.objects.create(buyer=self.other_buyer, total_price=Decimal("2.00"))
        self.authenticate_buyer()

        list_response = self.client.get(reverse("order-list"))
        other_detail_response = self.client.get(reverse("order-detail", args=[2]))

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual([order["id"] for order in list_response.data], [own_order.id])
        self.assertEqual(other_detail_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_seller_cannot_list_or_retrieve_orders(self):
        order = Order.objects.create(buyer=self.buyer, total_price=Decimal("1.00"))
        self.client.force_authenticate(self.seller)

        list_response = self.client.get(reverse("order-list"))
        detail_response = self.client.get(reverse("order-detail", args=[order.id]))

        self.assertEqual(list_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(detail_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_order_list_item_count_returns_order_line_count(self):
        self.add_item(quantity=2)
        self.authenticate_buyer()
        self.client.post(reverse("cart-checkout"), {}, format="json")

        response = self.client.get(reverse("order-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["item_count"], 1)

    def test_order_update_and_delete_methods_are_not_available(self):
        order = Order.objects.create(buyer=self.buyer, total_price=Decimal("1.00"))
        self.authenticate_buyer()

        put_response = self.client.put(
            reverse("order-detail", args=[order.id]),
            {"total_price": "2.00"},
            format="json",
        )
        patch_response = self.client.patch(
            reverse("order-detail", args=[order.id]),
            {"total_price": "2.00"},
            format="json",
        )
        delete_response = self.client.delete(reverse("order-detail", args=[order.id]))

        self.assertEqual(put_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(patch_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(delete_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        order.refresh_from_db()
        self.assertEqual(order.total_price, Decimal("1.00"))
