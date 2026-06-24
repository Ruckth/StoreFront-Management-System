from django.core.management.base import BaseCommand

from orders.models import Cart
from products.models import Product


class Command(BaseCommand):
    help = (
        "Remove legacy cart/product data before creating fresh UploadThing-backed "
        "product listings."
    )

    def handle(self, *args, **options):
        protected_product_ids = list(
            Product.objects.filter(order_items__isnull=False)
            .values_list("id", flat=True)
            .distinct()
        )

        cart_count = Cart.objects.count()
        Cart.objects.all().delete()

        deleted_product_count = Product.objects.exclude(
            id__in=protected_product_ids
        ).count()
        Product.objects.exclude(id__in=protected_product_ids).delete()

        protected_updated_count = Product.objects.filter(
            id__in=protected_product_ids
        ).update(available_quantity=0)

        self.stdout.write(self.style.SUCCESS(f"Deleted carts: {cart_count}"))
        self.stdout.write(
            self.style.SUCCESS(f"Deleted unprotected products: {deleted_product_count}")
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Marked order-protected products sold out: {protected_updated_count}"
            )
        )
