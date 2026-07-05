"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/useAuthStore";

/** Runs GET /auth once on app load to restore cookie session */
export function AuthHydrator() {
  const { refreshAuth } = useAuth();
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const clearSession = useAuthStore((s) => s.clearSession);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const started = useRef(false);

  useEffect(() => {
    if (isHydrated || started.current) return;
    started.current = true;

    void (async () => {
      try {
        await refreshAuth();
      } catch {
        clearSession();
      } finally {
        setHydrated(true);
      }
    })();
  }, [clearSession, isHydrated, refreshAuth, setHydrated]);

  return null;
}
