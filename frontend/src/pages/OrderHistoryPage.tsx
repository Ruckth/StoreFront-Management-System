import { ReceiptText, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { listOrders } from "../lib/api";
import type { OrderSummary } from "../types";

export function OrderHistoryPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const response = await listOrders(accessToken);
        if (isMounted) {
          setOrders(response);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Orders could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 max-[820px]:items-stretch">
        <div>
          <p className="text-xs font-extrabold uppercase text-[var(--app-accent)]">
            Buyer orders
          </p>
          <h1>Order History</h1>
        </div>
        <Button asChild variant="outline">
          <Link to="/products">
            <ShoppingBag aria-hidden="true" size={18} />
            Marketplace
          </Link>
        </Button>
      </div>

      {error ? <StatusMessage title="Order error" message={error} tone="error" /> : null}
      {isLoading ? (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          Loading orders...
        </div>
      ) : null}
      {!isLoading && !error && orders.length === 0 ? (
        <StatusMessage
          title="No orders yet"
          message="Completed checkouts will appear here."
        />
      ) : null}

      {orders.length > 0 ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Order</th>
                  <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Items</th>
                  <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Total</th>
                  <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Created</th>
                  <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="border-b p-3 font-extrabold">#{order.id}</td>
                    <td className="border-b p-3">{order.item_count}</td>
                    <td className="border-b p-3 font-bold">
                      {formatCurrency(order.total_price)}
                    </td>
                    <td className="border-b p-3">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="border-b p-3">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/orders/${order.id}`}>
                          <ReceiptText aria-hidden="true" size={16} />
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatCurrency(value: string) {
  return Number(value).toLocaleString(undefined, {
    currency: "USD",
    style: "currency",
  });
}
