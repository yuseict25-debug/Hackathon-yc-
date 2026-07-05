"use client";

import { useEffect, useState } from "react";

import { fetchFurniture } from "@/lib/api";
import { useFurnitureStore } from "@/stores/useFurnitureStore";
import { useSceneStore } from "@/stores/useSceneStore";

const HAS_API = Boolean(process.env.NEXT_PUBLIC_API_URL);

export function useFurniture() {
  const sessionId = useSceneStore((s) => s.sessionId);
  const items = useFurnitureStore((s) => s.items);
  const setItems = useFurnitureStore((s) => s.setItems);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);

    if (HAS_API && !sessionId) return;

    let cancelled = false;

    void fetchFurniture(sessionId ?? undefined)
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setIsLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, setItems]);

  return { items, isLoaded };
}
