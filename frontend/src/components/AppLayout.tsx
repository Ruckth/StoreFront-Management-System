import { LogOut, Package, Plus, ShoppingBag, UserRound } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function AppLayout() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/products");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/products" className="brand">
          <ShoppingBag aria-hidden="true" size={24} />
          <span>StoreFront</span>
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink to="/products">Marketplace</NavLink>
          {user?.role === "seller" ? (
            <>
              <NavLink to="/seller/products">Dashboard</NavLink>
              <NavLink to="/seller/products/new" className="icon-link">
                <Plus aria-hidden="true" size={18} />
                Product
              </NavLink>
            </>
          ) : null}
        </nav>
        <div className="account-actions">
          {isLoading ? (
            <span className="muted">Checking session</span>
          ) : isAuthenticated && user ? (
            <>
              <span className="user-chip">
                <UserRound aria-hidden="true" size={16} />
                {user.role}
              </span>
              <button type="button" className="ghost-button" onClick={handleLogout}>
                <LogOut aria-hidden="true" size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register" className="primary-link">
                Register
              </NavLink>
            </>
          )}
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <Package aria-hidden="true" size={16} />
        Product browsing and seller inventory management
      </footer>
    </div>
  );
}
