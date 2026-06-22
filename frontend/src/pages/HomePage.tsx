import { Store, Tags } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  function handleSell() {
    if (isAuthenticated && user?.role === "seller") {
      navigate("/seller/products");
      return;
    }

    navigate(isAuthenticated ? "/products" : "/login", {
      state: { from: { pathname: "/seller/products" } },
    });
  }

  return (
    <section
      className="grid min-h-[min(620px,calc(100vh-11rem))] content-center justify-items-center gap-8 text-center"
      aria-labelledby="home-title"
    >
      <div>
        <p className="text-xs font-extrabold uppercase text-[var(--app-accent)]">
          StoreFront
        </p>
        <h1
          id="home-title"
          className="max-w-2xl text-[clamp(2.5rem,9vw,6.8rem)] leading-none font-black uppercase"
        >
          Buy or sell in one clean place.
        </h1>
      </div>
      <div className="grid w-[min(720px,100%)] grid-cols-2 gap-3">
        <Link
          to="/products"
          className="inline-flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border bg-white text-[clamp(1.8rem,5vw,3.5rem)] font-black uppercase text-black transition hover:-translate-y-0.5 hover:border-black hover:shadow-[0_18px_38px_rgba(17,17,17,0.08)] max-[820px]:min-h-36"
        >
          <Tags aria-hidden="true" size={30} />
          <span>Buy</span>
        </Link>
        <button
          type="button"
          className="inline-flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border bg-white text-[clamp(1.8rem,5vw,3.5rem)] font-black uppercase text-black transition hover:-translate-y-0.5 hover:border-black hover:shadow-[0_18px_38px_rgba(17,17,17,0.08)] max-[820px]:min-h-36"
          onClick={handleSell}
        >
          <Store aria-hidden="true" size={30} />
          <span>Sell</span>
        </button>
      </div>
    </section>
  );
}
