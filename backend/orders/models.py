from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q

from products.models import Product


class Cart(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CHECKED_OUT = "checked_out", "Checked out"

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="carts",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)
        constraints = [
            models.UniqueConstraint(
                fields=("buyer",),
                condition=Q(status="active"),
                name="unique_active_cart_per_buyer",
            )
        ]

    @property
    def total_price(self):
        return sum((item.line_total for item in self.items.all()), Decimal("0.00"))

    def clean(self):
        super().clean()
        if self.buyer_id and self.buyer.role != "buyer":
            raise ValidationError({"buyer": "Carts can only be owned by buyers."})

    def __str__(self):
        return f"{self.buyer} cart ({self.status})"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("id",)
        constraints = [
            models.UniqueConstraint(
                fields=("cart", "product"),
                name="unique_product_per_cart",
            )
        ]

    @property
    def line_total(self):
        return self.product.unit_price * self.quantity

    def clean(self):
        super().clean()
        if self.quantity < 1:
            raise ValidationError({"quantity": "Quantity must be greater than 0."})
        if self.product_id and self.quantity > self.product.available_quantity:
            raise ValidationError({"quantity": "Quantity exceeds available stock."})

    def __str__(self):
        return f"{self.quantity} x {self.product}"


class Order(models.Model):
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def clean(self):
        super().clean()
        if self.buyer_id and self.buyer.role != "buyer":
            raise ValidationError({"buyer": "Orders can only be owned by buyers."})

    def __str__(self):
        return f"Order #{self.id} for {self.buyer}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    product_title_snapshot = models.CharField(max_length=255)
    unit_price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    class Meta:
        ordering = ("id",)

    @property
    def line_total(self):
        return self.unit_price_snapshot * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.product_title_snapshot}"
