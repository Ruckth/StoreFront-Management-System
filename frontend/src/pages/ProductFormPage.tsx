import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ProductForm } from "../components/ProductForm";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import { createProduct, getProduct, updateProduct } from "../lib/api";
import type { Product, ProductFormValues } from "../types";

type ProductFormPageProps = {
  mode: "create" | "edit";
};

export function ProductFormPage({ mode }: ProductFormPageProps) {
  const { id } = useParams();
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (mode !== "edit") {
        return;
      }

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
  }, [id, mode]);

  async function handleSubmit(values: ProductFormValues) {
    if (!accessToken) {
      setError("You need to login again before saving products.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (mode === "create") {
        await createProduct(values, accessToken);
      } else if (id) {
        await updateProduct(id, values, accessToken);
      }
      navigate("/seller/products");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Product could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="surface-state">Loading product form...</div>;
  }

  if (mode === "edit" && product && product.seller.id !== user?.id) {
    return <Navigate to="/products" replace />;
  }

  return (
    <section className="page-stack narrow-page">
      <Link to="/seller/products" className="back-link">
        <ArrowLeft aria-hidden="true" size={18} />
        Back to inventory
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Seller product</p>
          <h1>{mode === "create" ? "New product" : "Edit product"}</h1>
        </div>
      </div>
      {error ? <StatusMessage title="Could not save product" message={error} tone="error" /> : null}
      {mode === "edit" && !product ? (
        <StatusMessage title="Product not found" />
      ) : (
        <ProductForm
          initialProduct={product ?? undefined}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
}
