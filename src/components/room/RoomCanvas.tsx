"use client";

import { useEffect, useRef } from "react";

import { RoomRenderer } from "@/engine/pixi/RoomRenderer";
import { useCharacterAssets } from "@/hooks/useCharacterAssets";
import { useCharacterStore } from "@/stores/useCharacterStore";
import { useFurnitureStore } from "@/stores/useFurnitureStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useSceneStore } from "@/stores/useSceneStore";
import { useWorldStore } from "@/stores/useWorldStore";

export function RoomCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<RoomRenderer | null>(null);

  const { isReady: assetsReady } = useCharacterAssets();
  const room = useRoomStore((s) => s.room);
  const characters = useCharacterStore((s) => s.characters);
  const furniture = useFurnitureStore((s) => s.items);
  const worldBounds = useWorldStore((s) => s.bounds);
  const sceneRevision = useSceneStore((s) => s.appliedRevision);
  const sceneBackground = useSceneStore((s) => s.roomState?.background);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !assetsReady) return;

    const renderer = new RoomRenderer();
    rendererRef.current = renderer;

    let cancelled = false;

    void renderer.init(container).then(() => {
      if (cancelled) return;
      if (room) {
        renderer.renderObjects(room.objects);
        renderer.setLighting(room.lighting.warmth, room.lighting.brightness);
      }
      const sceneBackground = useSceneStore.getState().roomState?.background;
      if (sceneBackground) {
        renderer.updateSceneBackground(sceneBackground);
      }
      renderer.updateWorldFloor(useWorldStore.getState().bounds);
      renderer.renderCharacters(Object.values(characters));
      renderer.renderFurniture(furniture);
    });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const scaleX = 1920 / rect.width;
      const scaleY = 1080 / rect.height;
      renderer.handleMouseMove(
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top) * scaleY
      );
    };

    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelled = true;
      container.removeEventListener("mousemove", handleMouseMove);
      renderer.destroy();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetsReady]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !room) return;
    renderer.renderObjects(room.objects);
    renderer.setLighting(room.lighting.warmth, room.lighting.brightness);
  }, [room]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !assetsReady) return;
    renderer.renderCharacters(Object.values(characters));
  }, [characters, assetsReady]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.renderFurniture(furniture);
  }, [furniture]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.updateWorldFloor(worldBounds);
  }, [worldBounds]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !sceneBackground) return;
    renderer.updateSceneBackground(sceneBackground);
  }, [sceneRevision, sceneBackground]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      aria-label="Eula room"
    />
  );
}
