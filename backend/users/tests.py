from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User


class AuthenticationAPITests(APITestCase):
    def test_user_can_register_as_buyer(self):
        response = self.client.post(
            reverse("auth-register"),
            {"email": "buyer@example.com", "password": "StrongPassword123", "role": "buyer"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "buyer@example.com")
        self.assertEqual(response.data["role"], "buyer")
        self.assertNotIn("password", response.data)

    def test_user_can_register_as_seller(self):
        response = self.client.post(
            reverse("auth-register"),
            {"email": "seller@example.com", "password": "StrongPassword123", "role": "seller"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["role"], "seller")

    def test_duplicate_email_is_rejected(self):
        User.objects.create_user(
            email="buyer@example.com",
            password="StrongPassword123",
            role=User.Role.BUYER,
        )

        response = self.client.post(
            reverse("auth-register"),
            {"email": "buyer@example.com", "password": "StrongPassword123", "role": "buyer"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_invalid_role_is_rejected(self):
        response = self.client.post(
            reverse("auth-register"),
            {"email": "admin@example.com", "password": "StrongPassword123", "role": "admin"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", response.data)

    def test_login_returns_tokens_and_user(self):
        User.objects.create_user(
            email="buyer@example.com",
            password="StrongPassword123",
            role=User.Role.BUYER,
        )

        response = self.client.post(
            reverse("auth-login"),
            {"email": "buyer@example.com", "password": "StrongPassword123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "buyer@example.com")

    def test_current_user_requires_authentication(self):
        response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_current_user_returns_authenticated_user(self):
        user = User.objects.create_user(
            email="buyer@example.com",
            password="StrongPassword123",
            role=User.Role.BUYER,
        )
        self.client.force_authenticate(user)

        response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "buyer@example.com")
        self.assertEqual(response.data["role"], "buyer")
