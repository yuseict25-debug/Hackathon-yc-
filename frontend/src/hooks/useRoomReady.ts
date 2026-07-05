"use client";

import { useEffect, useState } from "react";

import { preloadFurnitureImages } from "@/engine/pixi/furnitureImages";
import { useCharacterAssets } from "@/hooks/useCharacterAssets";
import { useFurniture } from "@/hooks/useFurniture";
import { useRoomState } from "@/hooks/useRoomState";
import { useSession } from "@/hooks/useSession";

/** True when session, scene data, character sprites, and furniture images are ready */
export function useRoomReady(sessionId: string) {
  const { isReady: assetsReady } = useCharacterAssets();
  const { isReady: sessionReady } = useSession(sessionId);
  const { isLoaded: furnitureLoaded, items } = useFurniture();
  const { isLoaded: roomStateLoaded } = useRoomState();
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    setImagesReady(false);
  }, [sessionId]);

  useEffect(() => {
    if (!furnitureLoaded) return;

    let cancelled = false;

    void preloadFurnitureImages(items.map((item) => item.sprite)).then(() => {
      if (!cancelled) setImagesReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [furnitureLoaded, items]);

  const isReady =
    assetsReady &&
    sessionReady &&
    furnitureLoaded &&
    roomStateLoaded &&
    imagesReady;

  return { isReady };
}
