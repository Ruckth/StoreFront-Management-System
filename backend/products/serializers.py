from rest_framework import serializers

from products.models import Product


class ProductSellerSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)


class ProductSerializer(serializers.ModelSerializer):
    seller = ProductSellerSerializer(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "seller",
            "image",
            "title",
            "description",
            "unit_price",
            "available_quantity",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "seller", "created_at", "updated_at")

    def validate_unit_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Ensure this value is greater than 0.")
        return value

    def validate_available_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Ensure this value is greater than or equal to 0.")
        return value
