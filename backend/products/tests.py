from decimal import Decimal
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from products.models import Product
from users.models import User


def image_file(name="product.jpg"):
    image = Image.new("RGB", (20, 20), color="blue")
    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type="image/jpeg")


def invalid_image_file(name="product.txt"):
    return SimpleUploadedFile(name, b"not an image", content_type="text/plain")


@override_settings(MEDIA_ROOT="/tmp/storefront-test-media")
class ProductAPITests(APITestCase):
    def setUp(self):
        self.seller = User.objects.create_user(
            email="seller@example.com",
            password="StrongPassword123",
            role=User.Role.SELLER,
        )
        self.other_seller = User.objects.create_user(
            email="other-seller@example.com",
            password="StrongPassword123",
            role=User.Role.SELLER,
        )
        self.buyer = User.objects.create_user(
            email="buyer@example.com",
            password="StrongPassword123",
            role=User.Role.BUYER,
        )

    def product_payload(self, **overrides):
        data = {
            "image": image_file(),
            "title": "Notebook",
            "description": "A5 dotted notebook",
            "unit_price": "129.00",
            "available_quantity": 10,
        }
        data.update(overrides)
        return data

    def create_product(self, seller=None, **overrides):
        seller = seller or self.seller
        return Product.objects.create(
            seller=seller,
            image=image_file(),
            title=overrides.get("title", "Notebook"),
            description=overrides.get("description", "A5 dotted notebook"),
            unit_price=Decimal(overrides.get("unit_price", "129.00")),
            available_quantity=overrides.get("available_quantity", 10),
        )

    def test_seller_can_create_product(self):
        self.client.force_authenticate(self.seller)

        response = self.client.post(
            reverse("product-list"),
            self.product_payload(),
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Notebook")
        self.assertEqual(response.data["seller"]["email"], "seller@example.com")

    def test_client_cannot_spoof_product_seller_on_create(self):
        self.client.force_authenticate(self.seller)
        payload = self.product_payload(seller=self.other_seller.id)

        response = self.client.post(
            reverse("product-list"),
            payload,
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["seller"]["email"], "seller@example.com")
        self.assertEqual(Product.objects.get(id=response.data["id"]).seller, self.seller)

    def test_seller_can_list_and_retrieve_products(self):
        product = self.create_product(title="Notebook")
        self.create_product(seller=self.other_seller, title="Pen")
        self.client.force_authenticate(self.seller)

        list_response = self.client.get(reverse("product-list"))
        detail_response = self.client.get(reverse("product-detail", args=[product.id]))

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 2)
        self.assertEqual(detail_response.data["title"], "Notebook")

    def test_buyer_cannot_create_product(self):
        self.client.force_authenticate(self.buyer)

        response = self.client.post(
            reverse("product-list"),
            self.product_payload(),
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_user_cannot_create_product(self):
        response = self.client.post(
            reverse("product-list"),
            self.product_payload(),
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_buyer_can_list_and_retrieve_products(self):
        product = self.create_product(title="Notebook")
        self.client.force_authenticate(self.buyer)

        list_response = self.client.get(reverse("product-list"))
        detail_response = self.client.get(reverse("product-detail", args=[product.id]))

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data[0]["title"], "Notebook")
        self.assertEqual(detail_response.data["title"], "Notebook")

    def test_seller_can_edit_own_product(self):
        product = self.create_product()
        self.client.force_authenticate(self.seller)

        response = self.client.patch(
            reverse("product-detail", args=[product.id]),
            {"title": "Updated Notebook"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated Notebook")

    def test_client_cannot_spoof_product_seller_on_update(self):
        product = self.create_product()
        self.client.force_authenticate(self.seller)

        response = self.client.patch(
            reverse("product-detail", args=[product.id]),
            {"seller": self.other_seller.id, "title": "Updated Notebook"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertEqual(product.seller, self.seller)
        self.assertEqual(product.title, "Updated Notebook")

    def test_seller_cannot_edit_another_sellers_product(self):
        product = self.create_product(seller=self.other_seller)
        self.client.force_authenticate(self.seller)

        response = self.client.patch(
            reverse("product-detail", args=[product.id]),
            {"title": "Updated Notebook"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_buyer_cannot_edit_or_delete_products(self):
        product = self.create_product()
        self.client.force_authenticate(self.buyer)

        update_response = self.client.patch(
            reverse("product-detail", args=[product.id]),
            {"title": "Buyer Update"},
            format="json",
        )
        delete_response = self.client.delete(reverse("product-detail", args=[product.id]))

        self.assertEqual(update_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)
        product.refresh_from_db()
        self.assertEqual(product.title, "Notebook")

    def test_anonymous_user_cannot_edit_or_delete_products(self):
        product = self.create_product()

        update_response = self.client.patch(
            reverse("product-detail", args=[product.id]),
            {"title": "Anonymous Update"},
            format="json",
        )
        delete_response = self.client.delete(reverse("product-detail", args=[product.id]))

        self.assertEqual(update_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(delete_response.status_code, status.HTTP_401_UNAUTHORIZED)
        product.refresh_from_db()
        self.assertEqual(product.title, "Notebook")

    def test_seller_can_delete_own_product(self):
        product = self.create_product()
        self.client.force_authenticate(self.seller)

        response = self.client.delete(reverse("product-detail", args=[product.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(id=product.id).exists())

    def test_seller_cannot_delete_another_sellers_product(self):
        product = self.create_product(seller=self.other_seller)
        self.client.force_authenticate(self.seller)

        response = self.client.delete(reverse("product-detail", args=[product.id]))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_users_can_browse_products(self):
        self.create_product(title="Notebook")

        list_response = self.client.get(reverse("product-list"))
        detail_response = self.client.get(reverse("product-detail", args=[Product.objects.first().id]))

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data[0]["title"], "Notebook")

    def test_missing_image_is_rejected(self):
        self.client.force_authenticate(self.seller)
        payload = self.product_payload()
        payload.pop("image")

        response = self.client.post(
            reverse("product-list"),
            payload,
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image", response.data)

    def test_invalid_image_is_rejected(self):
        self.client.force_authenticate(self.seller)

        response = self.client.post(
            reverse("product-list"),
            self.product_payload(image=invalid_image_file()),
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image", response.data)

    def test_missing_title_is_rejected(self):
        self.client.force_authenticate(self.seller)
        payload = self.product_payload()
        payload.pop("title")

        response = self.client.post(
            reverse("product-list"),
            payload,
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)

    def test_blank_title_is_rejected(self):
        self.client.force_authenticate(self.seller)

        response = self.client.post(
            reverse("product-list"),
            self.product_payload(title=""),
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)

    def test_zero_price_is_rejected(self):
        self.client.force_authenticate(self.seller)

        response = self.client.post(
            reverse("product-list"),
            self.product_payload(unit_price="0.00"),
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("unit_price", response.data)

    def test_blank_title_update_is_rejected(self):
        product = self.create_product()
        self.client.force_authenticate(self.seller)

        response = self.client.patch(
            reverse("product-detail", args=[product.id]),
            {"title": ""},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)
        product.refresh_from_db()
        self.assertEqual(product.title, "Notebook")

    def test_zero_price_update_is_rejected(self):
        product = self.create_product()
        self.client.force_authenticate(self.seller)

        response = self.client.patch(
            reverse("product-detail", args=[product.id]),
            {"unit_price": "0.00"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("unit_price", response.data)
        product.refresh_from_db()
        self.assertEqual(product.unit_price, Decimal("129.00"))

    def test_negative_price_is_rejected(self):
        self.client.force_authenticate(self.seller)

        response = self.client.post(
            reverse("product-list"),
            self.product_payload(unit_price="-1.00"),
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("unit_price", response.data)

    def test_zero_quantity_is_allowed(self):
        self.client.force_authenticate(self.seller)

        response = self.client.post(
            reverse("product-list"),
            self.product_payload(available_quantity=0),
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["available_quantity"], 0)

    def test_negative_quantity_is_rejected(self):
        self.client.force_authenticate(self.seller)

        response = self.client.post(
            reverse("product-list"),
            self.product_payload(available_quantity=-1),
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("available_quantity", response.data)

    def test_negative_quantity_update_is_rejected(self):
        product = self.create_product()
        self.client.force_authenticate(self.seller)

        response = self.client.patch(
            reverse("product-detail", args=[product.id]),
            {"available_quantity": -1},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("available_quantity", response.data)
        product.refresh_from_db()
        self.assertEqual(product.available_quantity, 10)

    def test_product_search_filter_matches_title_or_description(self):
        self.create_product(title="Notebook", description="Dotted paper")
        self.create_product(title="Pen", description="Blue ink")

        response = self.client.get(reverse("product-list"), {"search": "dotted"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Notebook")

    def test_in_stock_filter_returns_only_available_products(self):
        self.create_product(title="Available", available_quantity=3)
        self.create_product(title="Sold Out", available_quantity=0)

        response = self.client.get(reverse("product-list"), {"in_stock": "true"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Available")
