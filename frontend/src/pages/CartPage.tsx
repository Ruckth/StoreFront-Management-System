import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ProductImage } from "../components/ProductImage";
import { StatusMessage } from "../components/StatusMessage";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import {
  checkoutCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../lib/api";
import type { Cart, CartItem, OrderDetail } from "../types";

export function CartPage() {
  const { accessToken } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [completedOrder, setCompletedOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCart() {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const response = await getCart(accessToken);
        if (isMounted) {
          setCart(response);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Cart could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCart();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  async function handleQuantityChange(item: CartItem, quantity: number) {
    if (!accessToken) {
      return;
    }

    setUpdatingItemId(item.id);
    setError("");
    setCompletedOrder(null);

    try {
      const updatedItem = await updateCartItem(item.id, quantity, accessToken);
      setCart((current) =>
        current
          ? {
              ...current,
              items: current.items.map((cartItem) =>
                cartItem.id === updatedItem.id ? updatedItem : cartItem,
              ),
              total_price: totalForItems(
                current.items.map((cartItem) =>
                  cartItem.id === updatedItem.id ? updatedItem : cartItem,
                ),
              ),
            }
          : current,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Cart item could not be updated.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function handleRemove(item: CartItem) {
    if (!accessToken) {
      return;
    }

    setUpdatingItemId(item.id);
    setError("");
    setCompletedOrder(null);

    try {
      await removeCartItem(item.id, accessToken);
      setCart((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((cartItem) => cartItem.id !== item.id),
              total_price: totalForItems(
                current.items.filter((cartItem) => cartItem.id !== item.id),
              ),
            }
          : current,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Cart item could not be removed.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function handleCheckout() {
    if (!accessToken) {
      return;
    }

    setIsCheckingOut(true);
    setError("");
    setCompletedOrder(null);

    try {
      const order = await checkoutCart(accessToken);
      const nextCart = await getCart(accessToken);
      setCompletedOrder(order);
      setCart(nextCart);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Checkout could not be completed.",
      );
    } finally {
      setIsCheckingOut(false);
    }
  }

  const hasItems = Boolean(cart?.items.length);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 max-[820px]:items-stretch">
        <div>
          <p className="text-xs font-extrabold uppercase text-[var(--app-accent)]">
            Buyer cart
          </p>
          <h1>Cart</h1>
        </div>
        <Button asChild variant="outline">
          <Link to="/products">
            <ShoppingBag aria-hidden="true" size={18} />
            Marketplace
          </Link>
        </Button>
      </div>

      {error ? <StatusMessage title="Cart error" message={error} tone="error" /> : null}
      {completedOrder ? (
        <StatusMessage
          title="Checkout complete"
          message={`Order #${completedOrder.id} was created for ${formatCurrency(
            completedOrder.total_price,
          )}.`}
          tone="success"
        />
      ) : null}

      {completedOrder ? (
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to={`/orders/${completedOrder.id}`}>
              <CheckCircle2 aria-hidden="true" size={18} />
              View order
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/orders">Order history</Link>
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          Loading cart...
        </div>
      ) : null}

      {!isLoading && !hasItems ? (
        <StatusMessage
          title="Your cart is empty"
          message="Add an in-stock product from the marketplace to begin checkout."
        />
      ) : null}

      {hasItems && cart ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Product</th>
                  <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Price</th>
                  <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Quantity</th>
                  <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Line total</th>
                  <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Remove</th>
                </tr>
              </thead>
              <tbody>
                {cart.items.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b p-3">
                      <div className="flex items-center gap-3 font-bold">
                        <ProductImage
                          src={item.product.image}
                          alt=""
                          className="h-12 w-12 rounded-md bg-muted object-cover"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/products/${item.product.id}`}
                            className="block truncate font-extrabold text-primary"
                          >
                            {item.product.title}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {item.product.available_quantity} in stock
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="border-b p-3">{formatCurrency(item.product.unit_price)}</td>
                    <td className="border-b p-3">
                      <div className="inline-grid min-h-9 grid-cols-3 items-center overflow-hidden rounded-full border bg-background">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-full rounded-none"
                          aria-label={`Decrease ${item.product.title} quantity`}
                          disabled={item.quantity <= 1 || updatingItemId === item.id}
                          onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        >
                          <Minus aria-hidden="true" size={16} />
                        </Button>
                        <span className="w-10 text-center text-sm font-extrabold">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-full rounded-none"
                          aria-label={`Increase ${item.product.title} quantity`}
                          disabled={
                            item.quantity >= item.product.available_quantity ||
                            updatingItemId === item.id
                          }
                          onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        >
                          <Plus aria-hidden="true" size={16} />
                        </Button>
                      </div>
                    </td>
                    <td className="border-b p-3 font-bold">
                      {formatCurrency(item.line_total)}
                    </td>
                    <td className="border-b p-3">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        aria-label={`Remove ${item.product.title}`}
                        disabled={updatingItemId === item.id}
                        onClick={() => handleRemove(item)}
                      >
                        <Trash2 aria-hidden="true" size={18} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-extrabold uppercase text-muted-foreground">
                Total
              </p>
              <strong className="text-2xl">{formatCurrency(cart.total_price)}</strong>
            </div>
            <Button
              type="button"
              className="min-h-10 rounded-full px-5 text-sm font-extrabold"
              disabled={isCheckingOut}
              onClick={handleCheckout}
            >
              <CheckCircle2 aria-hidden="true" size={18} />
              {isCheckingOut ? "Checking out" : "Checkout"}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function totalForItems(items: CartItem[]) {
  return items
    .reduce((total, item) => total + Number(item.line_total), 0)
    .toFixed(2);
}

function formatCurrency(value: string) {
  return Number(value).toLocaleString(undefined, {
    currency: "USD",
    style: "currency",
  });
}
