from django.contrib import admin

from products.models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "seller", "unit_price", "available_quantity", "created_at")
    list_filter = ("created_at", "updated_at")
    search_fields = ("title", "description", "seller__email")
