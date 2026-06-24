import { Edit3, Minus, Plus, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ProductImage } from "../components/ProductImage";
import { StatusMessage } from "../components/StatusMessage";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { addCartItem, getProduct } from "../lib/api";
import { getLocalProduct, isLocalProductId } from "../lib/localProducts";
import type { Product } from "../types";

export function ProductDetailPage() {
  const { id } = useParams();
  const { accessToken, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

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
  const isLocalProduct = isLocalProductId(product.id);

  async function handleAddToCart() {
    if (!product) {
      return;
    }

    if (!accessToken || !user) {
      navigate("/login", { state: { from: location } });
      return;
    }

    if (user.role !== "buyer") {
      setCartError("Only buyer accounts can add products to the cart.");
      return;
    }

    if (isLocalProduct) {
      setCartError("Locally stored products can be browsed, but only server products can be added to the cart.");
      return;
    }

    const productId = product.id;
    const productTitle = product.title;
    setIsAddingToCart(true);
    setCartError("");
    setCartMessage("");

    try {
      await addCartItem(productId, quantity, accessToken);
      setCartMessage(`${quantity} ${productTitle} added to cart.`);
    } catch (caughtError) {
      setCartError(
        caughtError instanceof Error ? caughtError.message : "Product could not be added.",
      );
    } finally {
      setIsAddingToCart(false);
    }
  }

  return (
    <section className="mx-auto w-[min(860px,100%)] bg-white">
      <div className="bg-neutral-200">
        <ProductImage
          src={product.image}
          alt={product.title}
          className="aspect-[4/5] max-h-[72vh] w-full bg-neutral-200 object-contain"
          fallbackClassName="bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(220,220,220,0.75)),#eeeeee]"
        />
      </div>
      <div className="flex flex-col gap-3.5 p-[clamp(1rem,2.8vw,1.5rem)]">
        <div>
          <h1 className="text-[clamp(2rem,4.2vw,3rem)] leading-none font-black uppercase text-black">
            {product.title}
          </h1>
          <p className="mt-1 text-[clamp(0.95rem,1.2vw,1.05rem)] leading-snug font-semibold text-black">
            StoreFront product
          </p>
        </div>
        <p className="max-w-3xl text-[clamp(0.95rem,1.2vw,1.05rem)] leading-snug font-semibold text-black">
          {product.description}
        </p>
        {cartError ? (
          <StatusMessage title="Cart error" message={cartError} tone="error" />
        ) : null}
        {cartMessage ? (
          <StatusMessage
            title={cartMessage}
            message="Open the cart when you are ready to checkout."
            tone="success"
          />
        ) : null}
        <strong className="text-xl font-bold text-black">
          {formatCurrency(product.unit_price)}
        </strong>
        <div className="flex flex-col gap-2 text-sm font-bold text-black">
          <span>
            Color: <strong>Black</strong>
          </span>
          <div className="flex h-18 w-15 items-center justify-center overflow-hidden rounded-md bg-neutral-200">
            <ProductImage src={product.image} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="grid grid-cols-[minmax(9rem,0.32fr)_1fr] gap-3 border-t pt-3.5 max-[820px]:grid-cols-1">
          <div
            className="grid min-h-11 grid-cols-3 items-center overflow-hidden rounded-full border border-neutral-200 bg-white"
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
            <span className="text-center text-base font-extrabold">{quantity}</span>
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
            className="min-h-11 rounded-full text-base font-black"
            disabled={
              product.available_quantity <= 0 ||
              isLocalProduct ||
              isAddingToCart
            }
            onClick={handleAddToCart}
          >
            <ShoppingCart aria-hidden="true" size={20} />
            {isAddingToCart
              ? "Adding"
              : product.available_quantity > 0
                ? "Add To Cart"
                : "Out Of Stock"}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {cartMessage ? (
            <Button asChild variant="outline">
              <Link to="/cart">View cart</Link>
            </Button>
          ) : null}
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
