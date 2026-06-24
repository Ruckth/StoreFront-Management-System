import { Edit3, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProductImage } from "../components/ProductImage";
import { StatusMessage } from "../components/StatusMessage";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { deleteProduct, listProducts } from "../lib/api";
import {
  deleteLocalProduct,
  isLocalProductId,
  listLocalProducts,
  mergeProducts,
} from "../lib/localProducts";
import type { Product } from "../types";

export function SellerDashboardPage() {
  const { accessToken, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<Product["id"] | null>(null);

  const sellerProducts = useMemo(
    () => products.filter((product) => product.seller.id === user?.id),
    [products, user?.id],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError("");
      try {
        const response = await listProducts();
        if (isMounted) {
          setProducts(mergeProducts(response));
        }
      } catch (caughtError) {
        if (isMounted) {
          const localProducts = listLocalProducts();
          setProducts(localProducts);
          setError(localProducts.length > 0 ? "" : caughtError instanceof Error
            ? caughtError.message
            : "Seller products could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDelete(product: Product) {
    if (!accessToken) {
      setError("You need to login again before deleting products.");
      return;
    }

    const confirmed = window.confirm(`Delete "${product.title}"?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);
    setError("");
    setSuccess("");

    try {
      if (isLocalProductId(product.id)) {
        deleteLocalProduct(product.id);
      } else {
        await deleteProduct(product.id, accessToken);
      }
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setSuccess("Product deleted.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Product could not be deleted.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 max-[820px]:items-stretch">
        <div>
          <p className="text-xs font-extrabold uppercase text-[var(--app-accent)]">
            Seller dashboard
          </p>
          <h1>Inventory</h1>
        </div>
        <Button asChild>
          <Link to="/seller/products/new">
            <Plus aria-hidden="true" size={18} />
            New product
          </Link>
        </Button>
      </div>
      {error ? <StatusMessage title="Dashboard error" message={error} tone="error" /> : null}
      {success ? <StatusMessage title={success} tone="success" /> : null}
      {isLoading ? (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          Loading inventory...
        </div>
      ) : null}
      {!isLoading && !error && sellerProducts.length === 0 ? (
        <StatusMessage title="No seller products yet" message="Create a product to start selling." />
      ) : null}
      {sellerProducts.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Product</th>
                <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Price</th>
                <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Quantity</th>
                <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Updated</th>
                <th className="border-b p-3 text-left text-xs font-extrabold uppercase text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellerProducts.map((product) => (
                <tr key={product.id}>
                  <td className="border-b p-3">
                    <div className="flex items-center gap-3 font-bold">
                      <ProductImage
                        src={product.image}
                        alt=""
                        className="h-12 w-12 rounded-md bg-muted object-cover"
                      />
                      <span>{product.title}</span>
                    </div>
                  </td>
                  <td className="border-b p-3">{formatCurrency(product.unit_price)}</td>
                  <td className="border-b p-3">{product.available_quantity}</td>
                  <td className="border-b p-3">{new Date(product.updated_at).toLocaleDateString()}</td>
                  <td className="border-b p-3">
                    <div className="flex gap-2">
                      {isLocalProductId(product.id) ? null : (
                        <Button asChild variant="outline" size="icon">
                          <Link
                            to={`/seller/products/${product.id}/edit`}
                            aria-label={`Edit ${product.title}`}
                            title={`Edit ${product.title}`}
                          >
                            <Edit3 aria-hidden="true" size={18} />
                          </Link>
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        aria-label={`Delete ${product.title}`}
                        title={`Delete ${product.title}`}
                        disabled={deletingId === product.id}
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 aria-hidden="true" size={18} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
