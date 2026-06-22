import { Edit3, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import { deleteProduct, listProducts } from "../lib/api";
import type { Product } from "../types";

export function SellerDashboardPage() {
  const { accessToken, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
          setProducts(response);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Seller products could not be loaded.",
          );
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
      await deleteProduct(product.id, accessToken);
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
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Seller dashboard</p>
          <h1>Inventory</h1>
        </div>
        <Link to="/seller/products/new" className="primary-button">
          <Plus aria-hidden="true" size={18} />
          New product
        </Link>
      </div>
      {error ? <StatusMessage title="Dashboard error" message={error} tone="error" /> : null}
      {success ? <StatusMessage title={success} tone="success" /> : null}
      {isLoading ? <div className="surface-state">Loading inventory...</div> : null}
      {!isLoading && !error && sellerProducts.length === 0 ? (
        <StatusMessage title="No seller products yet" message="Create a product to start selling." />
      ) : null}
      {sellerProducts.length > 0 ? (
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellerProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="table-product">
                      <img src={product.image} alt="" />
                      <span>{product.title}</span>
                    </div>
                  </td>
                  <td>{formatCurrency(product.unit_price)}</td>
                  <td>{product.available_quantity}</td>
                  <td>{new Date(product.updated_at).toLocaleDateString()}</td>
                  <td>
                    <div className="row-actions">
                      <Link
                        to={`/seller/products/${product.id}/edit`}
                        className="icon-button"
                        aria-label={`Edit ${product.title}`}
                        title={`Edit ${product.title}`}
                      >
                        <Edit3 aria-hidden="true" size={18} />
                      </Link>
                      <button
                        type="button"
                        className="icon-button danger"
                        aria-label={`Delete ${product.title}`}
                        title={`Delete ${product.title}`}
                        disabled={deletingId === product.id}
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 aria-hidden="true" size={18} />
                      </button>
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
