import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getCurrentUser, login as loginRequest } from "../lib/api";
import type { AuthContextValue } from "./authState";
import { AuthContext } from "./authState";
import type { AuthTokens, User } from "../types";

const STORAGE_KEY = "storefront.auth";

export function AuthProvider({ children }: PropsWithChildren) {
  const [tokens, setTokens] = useState<AuthTokens | null>(() => loadTokens());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(tokens?.access));

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTokens(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function hydrateUser() {
      if (!tokens?.access) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser(tokens.access);
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrateUser();

    return () => {
      isMounted = false;
    };
  }, [logout, tokens?.access]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    const nextTokens = {
      access: response.access,
      refresh: response.refresh,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTokens));
    setTokens(nextTokens);
    setUser(response.user);
    return response.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: tokens?.access ?? null,
      refreshToken: tokens?.refresh ?? null,
      user,
      isAuthenticated: Boolean(tokens?.access && user),
      isLoading,
      login,
      logout,
    }),
    [isLoading, login, logout, tokens?.access, tokens?.refresh, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function loadTokens() {
  const rawValue = localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthTokens;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
