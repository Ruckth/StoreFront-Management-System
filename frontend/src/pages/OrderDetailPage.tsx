import { ArrowLeft, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { getOrder } from "../lib/api";
import type { OrderDetail } from "../types";

export function OrderDetailPage() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      if (!accessToken || !id) {
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const response = await getOrder(id, accessToken);
        if (isMounted) {
          setOrder(response);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Order could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [accessToken, id]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 max-[820px]:items-stretch">
        <div>
          <p className="text-xs font-extrabold uppercase text-[var(--app-accent)]">
            Order detail
          </p>
          <h1>{order ? `Order #${order.id}` : "Order"}</h1>
        </div>
        <Button asChild variant="outline">
          <Link to="/orders">
            <ArrowLeft aria-hidden="true" size={18} />
            Orders
          </Link>
        </Button>
      </div>

      {error ? <StatusMessage title="Order error" message={error} tone="error" /> : null}
      {isLoading ? (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          Loading order...
        </div>
      ) : null}

      {order ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div className="inline-flex items-center gap-2">
              <ReceiptText aria-hidden="true" size={20} />
              <span className="font-extrabold">
                {new Date(order.created_at).toLocaleString()}
              </span>
            </div>
            <strong className="text-xl">{formatCurrency(order.total_price)}</strong>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Product</th>
                  <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Unit price</th>
                  <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Quantity</th>
                  <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Line total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b p-3">
                      <div className="font-extrabold">
                        {item.product_title_snapshot}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Product #{item.product_id}
                      </span>
                    </td>
                    <td className="border-b p-3">
                      {formatCurrency(item.unit_price_snapshot)}
                    </td>
                    <td className="border-b p-3">{item.quantity}</td>
                    <td className="border-b p-3 font-bold">
                      {formatCurrency(item.line_total)}
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
