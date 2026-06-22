import { Search, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { useAuth } from "../hooks/useAuth";
import { listProducts } from "../lib/api";
import { listLocalProducts, mergeProducts } from "../lib/localProducts";
import type { Product } from "../types";

type ProductListLocationState = {
  logout?: boolean;
};

export function ProductListPage() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
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
          setProducts(filterProducts(mergeProducts(response), search, inStockOnly));
        }
      } catch (caughtError) {
        if (isMounted) {
          const localProducts = filterProducts(listLocalProducts(), search, inStockOnly);
          setProducts(localProducts);
          setError(localProducts.length > 0 ? "" : caughtError instanceof Error
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
  }, [inStockOnly, search]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  return (
    <section className="flex flex-col gap-0 bg-white">
      <h1 className="sr-only">Shop All</h1>
      <form
        className="sticky top-[calc(5.4rem+1.65rem)] z-10 grid grid-cols-[minmax(12rem,1fr)_auto_auto] gap-0 border-b border-white bg-white/[0.97] p-0 backdrop-blur-xl max-[820px]:static max-[820px]:grid-cols-1"
        onSubmit={handleSearch}
      >
        <label className="inline-flex min-h-14 items-center gap-2 border-0 border-r border-r-neutral-200 bg-white px-4">
          <Search aria-hidden="true" size={18} />
          <Input
            className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            placeholder="Search products"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
        <label className="inline-flex min-h-14 items-center gap-2 border-0 border-r border-r-neutral-200 bg-white px-4 font-bold text-muted-foreground">
          <Checkbox
            checked={inStockOnly}
            onCheckedChange={(checked) => setInStockOnly(checked === true)}
          />
          <SlidersHorizontal aria-hidden="true" size={18} />
          In stock
        </label>
        <Button
          type="submit"
          variant="outline"
          className="min-h-14 rounded-none border-0 border-r border-r-neutral-200 bg-white px-5 font-bold shadow-none"
        >
          <Search aria-hidden="true" size={18} />
          Search
        </Button>
      </form>
      {error ? (
        <p className="m-0 bg-white px-4 py-3 text-sm text-neutral-600">
          Could not load products: {error}
        </p>
      ) : null}
      {isLoading ? (
        <p className="m-0 bg-white px-4 py-3 text-sm text-neutral-600">
          Loading products...
        </p>
      ) : null}
      {!isLoading && !error && products.length === 0 ? (
        <p className="m-0 bg-white px-4 py-3 text-sm text-neutral-600">
          No products found. Try a different search or filter.
        </p>
      ) : null}
      <div className="grid grid-cols-4 gap-[0.2rem] bg-white max-[820px]:grid-cols-2">
        {products.map((product) => (
          <article className="relative min-w-0 rounded-none bg-neutral-200 shadow-none" key={product.id}>
            <Link to={`/products/${product.id}`} className="flex min-h-full flex-col">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="aspect-[1/1.25] w-full bg-neutral-200 object-cover"
                />
              ) : (
                <div
                  className="aspect-[1/1.25] w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(220,220,220,0.75)),#eeeeee]"
                  aria-hidden="true"
                />
              )}
              <div className="grid min-h-[6.25rem] grid-cols-[1fr_auto] items-start gap-3 bg-neutral-200 px-4 py-3 pb-5 max-[820px]:min-h-[7.5rem] max-[820px]:grid-cols-1">
                <div>
                  <span className="mb-1 block text-xs font-bold text-black">
                    {product.available_quantity > 0 ? "Product" : "Sold out"}
                  </span>
                  <h2 className="text-base font-black uppercase text-black md:text-lg">
                    {product.title}
                  </h2>
                </div>
                <strong className="whitespace-nowrap text-base font-bold text-neutral-600">
                  {formatCurrency(product.unit_price)}
                </strong>
              </div>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 bottom-4 size-8 rounded-full bg-white text-black shadow-[0_8px_22px_rgba(17,17,17,0.1)] hover:bg-red-600 hover:text-white disabled:bg-white/65 disabled:text-neutral-500 max-[820px]:right-2 max-[820px]:bottom-2"
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

function filterProducts(products: Product[], search: string, inStockOnly: boolean) {
  const normalizedSearch = search.trim().toLowerCase();

  return products.filter((product) => {
    const matchesSearch =
      !normalizedSearch ||
      product.title.toLowerCase().includes(normalizedSearch) ||
      product.description.toLowerCase().includes(normalizedSearch);
    const matchesStock = !inStockOnly || product.available_quantity > 0;

    return matchesSearch && matchesStock;
  });
}
