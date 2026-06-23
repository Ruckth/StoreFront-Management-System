from django.urls import path
from rest_framework.routers import DefaultRouter

from orders.views import (
    ActiveCartView,
    CartItemCreateView,
    CartItemDetailView,
    CheckoutView,
    OrderViewSet,
)


router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")

urlpatterns = [
    path("cart/", ActiveCartView.as_view(), name="cart-active"),
    path("cart/items/", CartItemCreateView.as_view(), name="cart-item-list"),
    path("cart/items/<int:pk>/", CartItemDetailView.as_view(), name="cart-item-detail"),
    path("cart/checkout/", CheckoutView.as_view(), name="cart-checkout"),
    *router.urls,
]
