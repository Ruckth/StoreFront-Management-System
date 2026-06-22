from django.db.models import Q
from rest_framework import viewsets

from products.models import Product
from products.permissions import IsSellerOwnerOrReadOnly
from products.serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = (IsSellerOwnerOrReadOnly,)

    def get_queryset(self):
        queryset = Product.objects.select_related("seller").all()
        search = self.request.query_params.get("search")
        in_stock = self.request.query_params.get("in_stock")

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        if in_stock and in_stock.lower() in {"1", "true", "yes"}:
            queryset = queryset.filter(available_quantity__gt=0)

        return queryset

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
