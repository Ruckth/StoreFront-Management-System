import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Package,
  Plus,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  UserPlus,
  UserRound,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import type { AppNavItem } from "./AppSidebar";
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
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./ui/sidebar";
import { cn } from "../lib/utils";

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
    <SidebarProvider defaultOpen>
      <AppSidebar
        accountItems={accountItems}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        navItems={navItems}
        onLogout={handleLogout}
        role={user?.role}
      />
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <header className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b bg-white/[0.97] px-[clamp(0.75rem,2vw,1.25rem)] py-2 backdrop-blur-xl">
            <SidebarTrigger className="shrink-0" />
            <Breadcrumb className="min-w-0 flex-1 overflow-hidden max-[620px]:hidden">
              <BreadcrumbList className="flex-nowrap gap-1 text-[0.72rem] leading-none">
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
            <div className="ml-auto inline-flex min-w-0 items-center justify-end gap-2">
              {isLoading ? (
                <span className="text-sm text-muted-foreground max-[520px]:sr-only">
                  Checking session
                </span>
              ) : isAuthenticated && user ? (
                <>
                  <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border bg-background px-2 py-1 text-xs font-bold capitalize text-primary">
                    <UserRound aria-hidden="true" size={16} />
                    {user.role}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 font-bold max-[520px]:size-8 max-[520px]:px-0"
                    onClick={handleLogout}
                  >
                    <LogOut aria-hidden="true" size={18} />
                    <span className="max-[520px]:sr-only">Logout</span>
                  </Button>
                </>
              ) : null}
            </div>
          </header>
          <Breadcrumb className="hidden min-h-6 items-center border-b bg-white px-3 py-1 text-[0.68rem] max-[620px]:flex">
            <BreadcrumbList className="flex-nowrap gap-1 text-[0.68rem] leading-none">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return [
                  <BreadcrumbItem key={`${crumb.to}-${crumb.label}-mobile`}>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.to}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>,
                  !isLast ? (
                    <BreadcrumbSeparator key={`${crumb.to}-${crumb.label}-mobile-separator`} />
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
      </SidebarInset>
    </SidebarProvider>
  );
}

function getNavItems(role?: string): AppNavItem[] {
  const items: AppNavItem[] = [
    { label: "Marketplace", to: "/products", icon: ShoppingBag },
  ];

  if (role === "seller") {
    items.push(
      { label: "Dashboard", to: "/seller/products", icon: LayoutDashboard },
      { label: "Product", to: "/seller/products/new", icon: Plus },
    );
  }

  if (role === "buyer") {
    items.push(
      { label: "Cart", to: "/cart", icon: ShoppingCart },
      { label: "Orders", to: "/orders", icon: ReceiptText },
    );
  }

  return items;
}

function getAccountItems(isAuthenticated: boolean): AppNavItem[] {
  if (isAuthenticated) {
    return [];
  }

  return [
    { label: "Login", to: "/login", icon: LogIn },
    { label: "Register", to: "/register", icon: UserPlus, primary: true },
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

  if (pathname === "/cart") {
    return [
      { label: "Home", to: "/" },
      { label: "Cart", to: "/cart" },
    ];
  }

  if (pathname === "/orders") {
    return [
      { label: "Home", to: "/" },
      { label: "Orders", to: "/orders" },
    ];
  }

  if (pathname.startsWith("/orders/")) {
    return [
      { label: "Home", to: "/" },
      { label: "Orders", to: "/orders" },
      { label: "Order", to: pathname },
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
