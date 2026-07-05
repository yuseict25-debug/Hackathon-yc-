"use client";

import { useCallback } from "react";

import { fetchAuthUser, loginWithGoogleCredential, logout as apiLogout } from "@/lib/api";
import { DEV_MOCK_USER } from "@/stores/authStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { AuthError } from "@/types/auth";

const HAS_API = Boolean(process.env.NEXT_PUBLIC_API_URL);

/**
 * Auth hook — session lives in an httpOnly cookie set by POST /user/login.
 * Use refreshAuth (or AuthHydrator on load) to fetch GET /user/auth.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  const refreshAuth = useCallback(async () => {
    if (!HAS_API) {
      return null;
    }

    try {
      const authUser = await fetchAuthUser();
      setUser(authUser);
      return authUser;
    } catch (err) {
      if (err instanceof AuthError && err.status === 401) {
        clearSession();
        return null;
      }
      clearSession();
      throw err;
    }
  }, [clearSession, setUser]);

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      setLoading(true);

      try {
        if (HAS_API) {
          await loginWithGoogleCredential(credential);
          await refreshAuth();
        } else {
          await new Promise((r) => setTimeout(r, 300));
          setUser(DEV_MOCK_USER);
        }
      } finally {
        setLoading(false);
      }
    },
    [refreshAuth, setLoading, setUser]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (HAS_API) {
        await apiLogout();
      }
    } finally {
      clearSession();
      setLoading(false);
    }
  }, [clearSession, setLoading]);

  return {
    user,
    isAuthenticated,
    isHydrated,
    isLoading,
    refreshAuth,
    loginWithGoogle,
    logout,
  };
}
