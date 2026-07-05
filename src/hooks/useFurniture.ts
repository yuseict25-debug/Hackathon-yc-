"use client";

import { useEffect } from "react";

import { fetchFurniture } from "@/lib/api";
import { useFurnitureStore } from "@/stores/useFurnitureStore";

export function useFurniture() {
  const items = useFurnitureStore((s) => s.items);
  const setItems = useFurnitureStore((s) => s.setItems);

  useEffect(() => {
    if (items.length > 0) return;

    fetchFurniture().then(setItems);
  }, [items.length, setItems]);

  return { items };
}
