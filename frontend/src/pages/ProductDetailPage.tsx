import { Edit3, Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { getProduct } from "../lib/api";
import { getLocalProduct, isLocalProductId } from "../lib/localProducts";
import type { Product } from "../types";

const PRODUCT_SIZES = ["S", "M", "L", "XL", "2XL"];

export function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState(PRODUCT_SIZES[0]);
  const [quantity, setQuantity] = useState(1);
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

      if (isLocalProductId(id)) {
        setProduct(getLocalProduct(id));
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
          const localProduct = getLocalProduct(id);
          if (localProduct) {
            setProduct(localProduct);
          } else {
            setError(
              caughtError instanceof Error
                ? caughtError.message
                : "Product could not be loaded.",
            );
          }
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
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Loading product...
      </div>
    );
  }

  if (error) {
    return <StatusMessage title="Could not load product" message={error} tone="error" />;
  }

  if (!product) {
    return <StatusMessage title="Product not found" />;
  }

  const canEdit = user?.role === "seller" && user.id === product.seller.id;

  return (
    <section className="mx-auto w-[min(860px,100%)] bg-white">
      <div className="bg-neutral-200">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="aspect-[4/5] max-h-[72vh] w-full bg-neutral-200 object-contain"
          />
        ) : (
          <div
            className="aspect-[4/5] max-h-[72vh] w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(220,220,220,0.75)),#eeeeee]"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="flex flex-col gap-6 p-[clamp(1.5rem,5vw,3rem)]">
        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
          <div>
            <h1 className="text-[clamp(3.2rem,9vw,5.6rem)] leading-[0.92] font-black uppercase text-black">
              {product.title}
            </h1>
            <p className="text-[clamp(1.15rem,2.3vw,1.6rem)] leading-tight font-semibold text-black">
              StoreFront product
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-[3.25rem] bg-transparent text-black"
            aria-label="Save product"
          >
            <Heart aria-hidden="true" size={32} />
          </Button>
        </div>
        <p className="max-w-3xl text-[clamp(1.15rem,2.3vw,1.6rem)] leading-tight font-semibold text-black">
          {product.description}
        </p>
        <strong className="text-3xl font-bold text-black">
          {formatCurrency(product.unit_price)}
        </strong>
        <div className="flex flex-col gap-3 font-bold text-black">
          <div className="flex justify-between gap-4">
            <span>
              Size: <strong>{selectedSize}</strong>
            </span>
            <a href="#size-chart" className="underline">
              Size chart
            </a>
          </div>
          <div className="grid grid-cols-5 gap-1 max-[820px]:grid-cols-3" role="radiogroup" aria-label="Size">
            {PRODUCT_SIZES.map((size) => (
              <Button
                key={size}
                type="button"
                variant="outline"
                className={`min-h-11 rounded-md bg-white text-lg font-bold text-black ${
                  selectedSize === size ? "border-3 border-black" : "border-neutral-200"
                }`}
                aria-pressed={selectedSize === size}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 font-bold text-black">
          <span>
            Color: <strong>Black</strong>
          </span>
          <div className="flex h-[5.75rem] w-[4.75rem] items-center justify-center overflow-hidden rounded-md bg-neutral-200">
            {product.image ? (
              <img src={product.image} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-[minmax(12rem,0.32fr)_1fr] gap-4 border-t pt-6 max-[820px]:grid-cols-1">
          <div
            className="grid min-h-16 grid-cols-3 items-center overflow-hidden rounded-full border border-neutral-200 bg-white"
            aria-label="Quantity"
          >
            <Button
              type="button"
              variant="ghost"
              className="h-full rounded-none bg-transparent text-black"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            >
              <Minus aria-hidden="true" size={18} />
            </Button>
            <span className="text-center text-xl font-extrabold">{quantity}</span>
            <Button
              type="button"
              variant="ghost"
              className="h-full rounded-none bg-transparent text-black"
              aria-label="Increase quantity"
              disabled={quantity >= product.available_quantity}
              onClick={() =>
                setQuantity((current) =>
                  Math.min(product.available_quantity, current + 1),
                )
              }
            >
              <Plus aria-hidden="true" size={18} />
            </Button>
          </div>
          <Button
            type="button"
            className="min-h-16 rounded-full bg-red-600 text-xl font-black text-white hover:bg-red-700"
            disabled={product.available_quantity <= 0}
          >
            <ShoppingCart aria-hidden="true" size={22} />
            {product.available_quantity > 0 ? "Add To Cart" : "Out Of Stock"}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canEdit ? (
            <Button asChild variant="outline">
              <Link to={`/seller/products/${product.id}/edit`}>
              <Edit3 aria-hidden="true" size={18} />
              Edit
              </Link>
            </Button>
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
