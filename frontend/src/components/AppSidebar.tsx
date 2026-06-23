import { LogOut, Package, ShoppingBag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { Role } from "../types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "./ui/sidebar";

export type AppNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  primary?: boolean;
};

type AppSidebarProps = {
  accountItems: AppNavItem[];
  isAuthenticated: boolean;
  isLoading: boolean;
  navItems: AppNavItem[];
  onLogout: () => void;
  role?: Role;
};

export function AppSidebar({
  accountItems,
  isAuthenticated,
  isLoading,
  navItems,
  onLogout,
  role,
}: AppSidebarProps) {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="StoreFront">
              <Link to="/">
                <ShoppingBag aria-hidden="true" />
                <span className="font-extrabold">StoreFront</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <AppSidebarLink
                  isActive={isRouteActive(location.pathname, item.to)}
                  item={item}
                  key={item.to}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {!isAuthenticated && accountItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {accountItems.map((item) => (
                  <AppSidebarLink
                    isActive={isRouteActive(location.pathname, item.to)}
                    item={item}
                    key={item.to}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {isLoading ? (
            <SidebarMenuItem>
              <SidebarMenuButton disabled tooltip="Checking session">
                <Package aria-hidden="true" />
                <span>Checking session</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : isAuthenticated ? (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={role ?? "Account"}>
                  <Package aria-hidden="true" />
                  <span className="capitalize">{role}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarLogoutButton onLogout={onLogout} />
              </SidebarMenuItem>
            </>
          ) : null}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function AppSidebarLink({
  isActive,
  item,
}: {
  isActive: boolean;
  item: AppNavItem;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.label}
        variant={item.primary ? "outline" : "default"}
      >
        <Link
          to={item.to}
          onClick={() => {
            if (isMobile) {
              setOpenMobile(false);
            }
          }}
        >
          <item.icon aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarLogoutButton({ onLogout }: { onLogout: () => void }) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenuButton
      tooltip="Logout"
      onClick={() => {
        if (isMobile) {
          setOpenMobile(false);
        }
        onLogout();
      }}
    >
      <LogOut aria-hidden="true" />
      <span>Logout</span>
    </SidebarMenuButton>
  );
}

function isRouteActive(pathname: string, to: string) {
  if (to === "/products") {
    return pathname === "/products" || pathname.startsWith("/products/");
  }

  if (to === "/seller/products") {
    return pathname === "/seller/products" || pathname.includes("/edit");
  }

  if (to === "/orders") {
    return pathname === "/orders" || pathname.startsWith("/orders/");
  }

  return pathname === to;
}
