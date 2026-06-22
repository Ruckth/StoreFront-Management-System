import { LogOut, Menu, Package, Plus, ShoppingBag, UserRound } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { cn } from "../lib/utils";

type NavItem = {
  label: string;
  to: string;
  icon?: typeof Plus;
  primary?: boolean;
};

export function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = getNavItems(user?.role);
  const accountItems = getAccountItems(isAuthenticated);
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const isBuyerCatalog = location.pathname === "/products";

  function handleLogout() {
    navigate("/products", { replace: true, state: { logout: true } });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 grid min-h-[5.4rem] grid-cols-[auto_1fr_auto] items-center gap-4 border-b bg-white/[0.97] px-[clamp(1rem,3vw,1.75rem)] py-3 backdrop-blur-xl max-[820px]:min-h-[3.7rem] max-[820px]:gap-2 max-[820px]:px-3 max-[820px]:py-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden size-9 max-[820px]:inline-flex"
              aria-label="Open navigation menu"
            >
              <Menu aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(20rem,86vw)]">
            <SheetHeader>
              <SheetTitle>StoreFront</SheetTitle>
              <SheetDescription>Navigation</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4 pb-4" aria-label="Mobile navigation">
              {[...navItems, ...accountItems].map((item) => (
                <SheetClose asChild key={`${item.to}-${item.label}`}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      mobileNavClass({ isActive, primary: item.primary })
                    }
                  >
                    {item.icon ? <item.icon aria-hidden="true" size={18} /> : null}
                    {item.label}
                  </NavLink>
                </SheetClose>
              ))}
              {isAuthenticated ? (
                <SheetClose asChild>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-transparent px-3 text-left font-bold text-foreground hover:bg-muted"
                    onClick={handleLogout}
                  >
                    <LogOut aria-hidden="true" size={18} />
                    Logout
                  </button>
                </SheetClose>
              ) : null}
            </nav>
          </SheetContent>
        </Sheet>
        <Link
          to="/"
          className="inline-flex min-w-0 items-center gap-2 font-extrabold text-black"
        >
          <ShoppingBag aria-hidden="true" size={24} />
          <span className="truncate">StoreFront</span>
        </Link>
        <nav
          className="flex flex-wrap justify-center gap-2 max-[820px]:hidden"
          aria-label="Primary navigation"
        >
          {navItems.map((item) => (
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                desktopNavClass({ isActive, icon: Boolean(item.icon) })
              }
              key={item.to}
            >
              {item.icon ? <item.icon aria-hidden="true" size={18} /> : null}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="inline-flex flex-wrap items-center gap-2 max-[820px]:hidden">
          {isLoading ? (
            <span className="text-muted-foreground">Checking session</span>
          ) : isAuthenticated && user ? (
            <>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-full border bg-background px-3 py-2 text-sm font-bold capitalize text-primary">
                <UserRound aria-hidden="true" size={16} />
                {user.role}
              </span>
              <Button
                type="button"
                variant="ghost"
                className="gap-2 font-bold"
                onClick={handleLogout}
              >
                <LogOut aria-hidden="true" size={18} />
                Logout
              </Button>
            </>
          ) : (
            accountItems.map((item) => (
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  desktopNavClass({ isActive, primary: item.primary })
                }
                key={item.to}
              >
                {item.label}
              </NavLink>
            ))
          )}
        </div>
        <div className="hidden items-center justify-end max-[820px]:inline-flex">
          {isLoading ? null : isAuthenticated && user ? (
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border bg-background px-2 py-1 text-xs font-bold capitalize text-primary">
              <UserRound aria-hidden="true" size={16} />
              {user.role}
            </span>
          ) : (
            <NavLink
              to="/register"
              className="inline-flex min-h-8 items-center justify-center rounded-full bg-black px-3 py-1 text-sm font-bold text-white"
            >
              Register
            </NavLink>
          )}
        </div>
      </header>
      <Breadcrumb className="flex min-h-6 items-center border-b bg-white px-[clamp(1rem,3vw,1.75rem)] py-1 text-[0.72rem] max-[820px]:min-h-5 max-[820px]:px-3 max-[820px]:py-0.5">
        <BreadcrumbList className="gap-1 text-[0.72rem] leading-none max-[820px]:text-[0.68rem]">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return [
              <BreadcrumbItem key={`${crumb.to}-${crumb.label}`}>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.to}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>,
              !isLast ? (
              <BreadcrumbSeparator key={`${crumb.to}-${crumb.label}-separator`} />
              ) : null,
            ];
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <main
        className={cn(
          "mx-auto w-[min(1180px,calc(100%-2rem))] flex-1 py-8 pb-12 max-[820px]:w-[min(100%-1rem,1180px)] max-[820px]:pt-4",
          isBuyerCatalog && "w-full max-w-none p-0 max-[820px]:w-full max-[820px]:pt-0",
        )}
      >
        <Outlet />
      </main>
      <footer
        className={cn(
          "inline-flex items-center justify-center gap-2 border-t p-4 text-sm text-muted-foreground",
          isBuyerCatalog && "hidden",
        )}
      >
        <Package aria-hidden="true" size={16} />
        Product browsing and seller inventory management
      </footer>
    </div>
  );
}

function desktopNavClass({
  icon,
  isActive,
  primary,
}: {
  icon?: boolean;
  isActive: boolean;
  primary?: boolean;
}) {
  return cn(
    "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-none bg-transparent px-1.5 py-2 font-bold text-black underline-offset-4 hover:underline",
    icon && "gap-2",
    primary &&
      "rounded-full bg-black px-3 text-white no-underline hover:bg-black/90 hover:no-underline",
    isActive && !primary && "underline",
  );
}

function mobileNavClass({
  isActive,
  primary,
}: {
  isActive: boolean;
  primary?: boolean;
}) {
  return cn(
    "inline-flex min-h-11 items-center gap-2 rounded-lg bg-transparent px-3 font-bold text-foreground hover:bg-muted",
    isActive && "bg-muted",
    primary &&
      "justify-center rounded-full bg-black text-white hover:bg-black/90",
  );
}

function getNavItems(role?: string): NavItem[] {
  const items: NavItem[] = [{ label: "Marketplace", to: "/products" }];

  if (role === "seller") {
    items.push(
      { label: "Dashboard", to: "/seller/products" },
      { label: "Product", to: "/seller/products/new", icon: Plus },
    );
  }

  return items;
}

function getAccountItems(isAuthenticated: boolean): NavItem[] {
  if (isAuthenticated) {
    return [];
  }

  return [
    { label: "Login", to: "/login" },
    { label: "Register", to: "/register", primary: true },
  ];
}

function getBreadcrumbs(pathname: string) {
  if (pathname === "/") {
    return [{ label: "Home", to: "/" }];
  }

  if (pathname === "/products") {
    return [
      { label: "Home", to: "/" },
      { label: "Marketplace", to: "/products" },
    ];
  }

  if (pathname.startsWith("/products/")) {
    return [
      { label: "Home", to: "/" },
      { label: "Marketplace", to: "/products" },
      { label: "Product", to: pathname },
    ];
  }

  if (pathname === "/seller/products") {
    return [
      { label: "Home", to: "/" },
      { label: "Seller", to: "/seller/products" },
      { label: "Dashboard", to: "/seller/products" },
    ];
  }

  if (pathname === "/seller/products/new") {
    return [
      { label: "Home", to: "/" },
      { label: "Seller", to: "/seller/products" },
      { label: "New Product", to: "/seller/products/new" },
    ];
  }

  if (pathname.includes("/edit")) {
    return [
      { label: "Home", to: "/" },
      { label: "Seller", to: "/seller/products" },
      { label: "Edit Product", to: pathname },
    ];
  }

  if (pathname === "/login") {
    return [
      { label: "Home", to: "/" },
      { label: "Login", to: "/login" },
    ];
  }

  if (pathname === "/register") {
    return [
      { label: "Home", to: "/" },
      { label: "Register", to: "/register" },
    ];
  }

  return [
    { label: "Home", to: "/" },
    { label: "Page", to: pathname },
  ];
}
