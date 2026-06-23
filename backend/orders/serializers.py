from decimal import Decimal

from rest_framework import serializers

from orders.models import Cart, CartItem, Order, OrderItem
from products.models import Product


class CartProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ("id", "title", "image", "unit_price", "available_quantity")


class CartItemSerializer(serializers.ModelSerializer):
    product = CartProductSerializer(read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ("id", "product", "quantity", "line_total")

    def get_line_total(self, obj):
        return format_money(obj.line_total)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(read_only=True, many=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ("id", "status", "items", "total_price", "created_at", "updated_at")

    def get_total_price(self, obj):
        return format_money(obj.total_price)


class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

    def validate_product_id(self, value):
        try:
            return Product.objects.get(id=value)
        except Product.DoesNotExist as exc:
            raise serializers.ValidationError("Product does not exist.") from exc

    def validate(self, attrs):
        product = attrs["product_id"]
        quantity = attrs["quantity"]
        cart = self.context["cart"]
        existing_item = CartItem.objects.filter(cart=cart, product=product).first()
        next_quantity = quantity + (existing_item.quantity if existing_item else 0)

        if next_quantity > product.available_quantity:
            raise serializers.ValidationError(
                {"quantity": "Quantity exceeds available stock."}
            )

        attrs["product"] = product
        return attrs

    def create(self, validated_data):
        product = validated_data["product"]
        quantity = validated_data["quantity"]
        cart = self.context["cart"]
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity},
        )
        if not created:
            item.quantity += quantity
            item.save(update_fields=("quantity", "updated_at"))
        return item


class UpdateCartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ("quantity",)

    def validate_quantity(self, value):
        if value > self.instance.product.available_quantity:
            raise serializers.ValidationError("Quantity exceeds available stock.")
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product_id",
            "product_title_snapshot",
            "unit_price_snapshot",
            "quantity",
            "line_total",
        )

    def get_line_total(self, obj):
        return format_money(obj.line_total)


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ("id", "total_price", "item_count", "created_at")

    def get_item_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(read_only=True, many=True)

    class Meta:
        model = Order
        fields = ("id", "total_price", "items", "created_at")


def format_money(value):
    return f"{Decimal(value):.2f}"
