import { Edit3, PackageCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import { getProduct } from "../lib/api";
import type { Product } from "../types";

export function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!id) {
        setError("Product id is missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const response = await getProduct(id);
        if (isMounted) {
          setProduct(response);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Product could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return <div className="surface-state">Loading product...</div>;
  }

  if (error) {
    return <StatusMessage title="Could not load product" message={error} tone="error" />;
  }

  if (!product) {
    return <StatusMessage title="Product not found" />;
  }

  const canEdit = user?.role === "seller" && user.id === product.seller.id;

  return (
    <section className="detail-layout">
      <div className="detail-media">
        <img src={product.image} alt={product.title} />
      </div>
      <div className="detail-content">
        <p className="eyebrow">Product detail</p>
        <h1>{product.title}</h1>
        <p>{product.description}</p>
        <dl className="metric-list">
          <div>
            <dt>Price</dt>
            <dd>{formatCurrency(product.unit_price)}</dd>
          </div>
          <div>
            <dt>Inventory</dt>
            <dd>{product.available_quantity}</dd>
          </div>
          <div>
            <dt>Seller</dt>
            <dd>{product.seller.email}</dd>
          </div>
        </dl>
        <div className="detail-actions">
          <span className="status-badge">
            <PackageCheck aria-hidden="true" size={18} />
            {product.available_quantity > 0 ? "Available" : "Out of stock"}
          </span>
          {canEdit ? (
            <Link to={`/seller/products/${product.id}/edit`} className="secondary-button">
              <Edit3 aria-hidden="true" size={18} />
              Edit
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function formatCurrency(value: string) {
  return Number(value).toLocaleString(undefined, {
    currency: "USD",
    style: "currency",
  });
}
