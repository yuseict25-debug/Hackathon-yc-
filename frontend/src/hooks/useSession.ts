"use client";

import { useEffect, useRef } from "react";

import { resetSessionClientState } from "@/lib/sessionReset";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSceneStore } from "@/stores/useSceneStore";

const HAS_API = Boolean(process.env.NEXT_PUBLIC_API_URL);

/**
 * Binds the active backend session to the URL param `/room/[id]`.
 */
export function useSession(routeSessionId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const sessionId = useSceneStore((s) => s.sessionId);
  const setSessionId = useSceneStore((s) => s.setSessionId);
  const prevRouteId = useRef<string | null>(null);

  useEffect(() => {
    if (!routeSessionId) return;

    if (prevRouteId.current !== routeSessionId) {
      if (prevRouteId.current != null) {
        resetSessionClientState();
      }
      prevRouteId.current = routeSessionId;
      setSessionId(routeSessionId);
    }
  }, [routeSessionId, setSessionId]);

  useEffect(() => {
    if (!isAuthenticated) {
      prevRouteId.current = null;
      resetSessionClientState();
      setSessionId(null);
    }
  }, [isAuthenticated, setSessionId]);

  const isReady =
    !HAS_API || (Boolean(routeSessionId) && sessionId === routeSessionId);

  return { sessionId: sessionId ?? routeSessionId, isReady };
}
