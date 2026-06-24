import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ProductForm, ProductStepForm } from "../components/ProductForm";
import { StatusMessage } from "../components/StatusMessage";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { createProduct, getProduct, updateProduct } from "../lib/api";
import { uploadProductImage } from "../lib/uploadthing";
import type { Product, ProductFormValues, ProductMutationValues } from "../types";

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
    if (mode === "create") {
      if (!accessToken) {
        setError("You need to login again before saving products.");
        return;
      }

      setIsSubmitting(true);
      setError("");

      try {
        const productValues = await productMutationValues(values, accessToken, true);
        await createProduct(productValues, accessToken);
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
      return;
    }

    if (!accessToken) {
      setError("You need to login again before saving products.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (id) {
        const productValues = await productMutationValues(values, accessToken, false);
        await updateProduct(id, productValues, accessToken);
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
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Loading product form...
      </div>
    );
  }

  if (mode === "edit" && product && product.seller.id !== user?.id) {
    return <Navigate to="/products" replace />;
  }

  return (
    <section className="mx-auto flex w-[min(680px,100%)] flex-col gap-4">
      <Button asChild variant="ghost" className="w-fit px-0 text-muted-foreground hover:text-primary">
        <Link to="/seller/products">
          <ArrowLeft aria-hidden="true" size={18} />
          Back to inventory
        </Link>
      </Button>
      <div className="flex items-end justify-between gap-4 max-[820px]:items-stretch">
        <div>
          <p className="text-xs font-extrabold uppercase text-[var(--app-accent)]">
            Seller product
          </p>
          <h1>{mode === "create" ? "New product" : "Edit product"}</h1>
        </div>
      </div>
      {error ? <StatusMessage title="Could not save product" message={error} tone="error" /> : null}
      {mode === "edit" && !product ? (
        <StatusMessage title="Product not found" />
      ) : mode === "create" ? (
        <ProductStepForm isSubmitting={isSubmitting} onSubmit={handleSubmit} />
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

async function productMutationValues(
  values: ProductFormValues,
  token: string,
  requireImage: boolean,
): Promise<ProductMutationValues> {
  if (requireImage && !values.image) {
    throw new Error("Product image is required.");
  }

  const image = values.image
    ? await uploadProductImage(values.image, token)
    : undefined;

  return {
    title: values.title,
    description: values.description,
    unit_price: values.unit_price,
    available_quantity: values.available_quantity,
    ...(image ? { image } : {}),
  };
}
