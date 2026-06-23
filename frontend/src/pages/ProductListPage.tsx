import { Search, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { useAuth } from "../hooks/useAuth";
import { listProducts } from "../lib/api";
import { listLocalProducts, mergeProducts, seedDemoProducts } from "../lib/localProducts";
import type { Product } from "../types";

type ProductListLocationState = {
  logout?: boolean;
};

type StockFilter = "all" | "in-stock" | "sold-out";

const STOCK_FILTERS: Array<{ label: string; value: StockFilter }> = [
  { label: "All", value: "all" },
  { label: "In stock", value: "in-stock" },
  { label: "Sold out", value: "sold-out" },
];

export function ProductListPage() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("in-stock");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const state = location.state as ProductListLocationState | null;
    if (state?.logout) {
      logout();
      navigate("/products", { replace: true, state: null });
    }
  }, [location.state, logout, navigate]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError("");
      try {
        const response = await listProducts();
        if (isMounted) {
          setProducts(filterProducts(mergeProducts(response), search, stockFilter));
        }
      } catch (caughtError) {
        if (isMounted) {
          const storedProducts = listLocalProducts();
          const fallbackProducts =
            storedProducts.length > 0 ? storedProducts : seedDemoProducts();
          const localProducts = filterProducts(fallbackProducts, search, stockFilter);
          setProducts(localProducts);
          setError(fallbackProducts.length > 0 ? "" : caughtError instanceof Error
            ? caughtError.message
            : "Products could not be loaded.");
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
  }, [search, stockFilter]);

  return (
    <section className="catalog-page">
      <h1 className="sr-only">Shop All</h1>

      <div className="catalog-filter-row">
        <label className="catalog-search-field">
          <Search aria-hidden="true" size={15} />
          <Input
            className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            placeholder="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="catalog-mobile-stock-control" aria-label="Mobile sold out filter">
          <div className="catalog-mobile-stock-check">
            <Checkbox
              id="catalog-mobile-sold-out"
              className="catalog-mobile-stock-checkbox"
              checked={stockFilter === "all"}
              onCheckedChange={(checked) => {
                setStockFilter(checked === true ? "all" : "in-stock");
              }}
            />
            <label htmlFor="catalog-mobile-sold-out">
              Show sold out
            </label>
          </div>
        </div>
        <div className="catalog-stock-chips" aria-label="Stock filter">
          {STOCK_FILTERS.map((filter) => (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="catalog-stock-chip"
              data-active={stockFilter === filter.value}
              aria-pressed={stockFilter === filter.value}
              key={filter.value}
              onClick={() => setStockFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="catalog-inline-state">
          Could not load products: {error}
        </p>
      ) : null}
      {isLoading ? (
        <p className="catalog-inline-state">
          Loading products...
        </p>
      ) : null}
      {!isLoading && !error && products.length === 0 ? (
        <p className="catalog-inline-state">
          No products found. Try a different search or filter.
        </p>
      ) : null}
      <div className="catalog-grid">
        {products.map((product) => (
          <article className="catalog-card" key={product.id}>
            <Link to={`/products/${product.id}`} className="catalog-card-link">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="catalog-card-image"
                />
              ) : (
                <div
                  className="catalog-card-image catalog-card-placeholder"
                  aria-hidden="true"
                />
              )}
              <div className="catalog-card-body">
                <div>
                  <span>
                    {product.available_quantity > 0 ? "Product" : "Sold out"}
                  </span>
                  <h2>
                    {product.title}
                  </h2>
                </div>
                <strong>
                  {formatCurrency(product.unit_price)}
                </strong>
              </div>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="catalog-cart-button"
              aria-label={`Add ${product.title} to cart`}
              disabled={product.available_quantity <= 0}
            >
              <ShoppingCart aria-hidden="true" size={20} />
            </Button>
          </article>
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

function filterProducts(
  products: Product[],
  search: string,
  stockFilter: StockFilter,
) {
  const normalizedSearch = search.trim().toLowerCase();

  return products.filter((product) => {
    const matchesSearch =
      !normalizedSearch ||
      product.title.toLowerCase().includes(normalizedSearch) ||
      product.description.toLowerCase().includes(normalizedSearch);
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in-stock" && product.available_quantity > 0) ||
      (stockFilter === "sold-out" && product.available_quantity <= 0);

    return matchesSearch && matchesStock;
  });
}
