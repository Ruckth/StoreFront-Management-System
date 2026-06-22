import { Search, SlidersHorizontal } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";
import { listProducts } from "../lib/api";
import type { Product } from "../types";

export function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError("");
      try {
        const response = await listProducts({ search, inStock: inStockOnly });
        if (isMounted) {
          setProducts(response);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Products could not be loaded.",
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
  }, [inStockOnly, search]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Marketplace</p>
          <h1>Products</h1>
        </div>
      </div>
      <form className="toolbar" onSubmit={handleSearch}>
        <label className="search-field">
          <Search aria-hidden="true" size={18} />
          <input
            placeholder="Search products"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
        <label className="toggle-field">
          <input
            checked={inStockOnly}
            type="checkbox"
            onChange={(event) => setInStockOnly(event.target.checked)}
          />
          <SlidersHorizontal aria-hidden="true" size={18} />
          In stock
        </label>
        <button type="submit" className="secondary-button">
          <Search aria-hidden="true" size={18} />
          Search
        </button>
      </form>
      {error ? <StatusMessage title="Could not load products" message={error} tone="error" /> : null}
      {isLoading ? <div className="surface-state">Loading products...</div> : null}
      {!isLoading && !error && products.length === 0 ? (
        <StatusMessage title="No products found" message="Try a different search or filter." />
      ) : null}
      <div className="product-grid">
        {products.map((product) => (
          <Link to={`/products/${product.id}`} className="product-card" key={product.id}>
            <img src={product.image} alt={product.title} />
            <div className="product-card-body">
              <span className="stock-pill">
                {product.available_quantity > 0 ? "In stock" : "Out of stock"}
              </span>
              <h2>{product.title}</h2>
              <p>{product.description}</p>
              <div className="product-meta">
                <strong>{formatCurrency(product.unit_price)}</strong>
                <span>{product.available_quantity} available</span>
              </div>
            </div>
          </Link>
        ))}
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
