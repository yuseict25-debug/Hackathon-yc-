import { Assets, Texture } from "pixi.js";

import { isBackendImageUrl } from "@/lib/images";

/** Preload furniture textures so the room can appear all at once */
export async function preloadFurnitureImages(spriteUrls: string[]): Promise<void> {
  const urls = [...new Set(spriteUrls.filter(isBackendImageUrl))];
  if (urls.length === 0) return;

  await Promise.all(
    urls.map(async (url) => {
      try {
        const texture = await Assets.load<Texture>(url);
        texture.source.scaleMode = "nearest";
      } catch (err) {
        console.warn("[FurnitureImages] Failed to preload:", url, err);
      }
    })
  );
}
