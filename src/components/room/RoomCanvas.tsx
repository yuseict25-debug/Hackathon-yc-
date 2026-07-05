"use client";

import { useEffect, useRef } from "react";

import { RoomRenderer } from "@/engine/pixi/RoomRenderer";
import { useCharacterStore } from "@/stores/useCharacterStore";
import { useFurnitureStore } from "@/stores/useFurnitureStore";
import { useRoomStore } from "@/stores/useRoomStore";

export function RoomCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<RoomRenderer | null>(null);

  const room = useRoomStore((s) => s.room);
  const characters = useCharacterStore((s) => s.characters);
  const furniture = useFurnitureStore((s) => s.items);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new RoomRenderer();
    rendererRef.current = renderer;

    let destroyed = false;

    renderer.init(container).then(() => {
      if (destroyed) {
        renderer.destroy();
        return;
      }
      if (room) {
        renderer.renderObjects(room.objects);
        renderer.setLighting(room.lighting.warmth, room.lighting.brightness);
      }
      renderer.renderCharacters(Object.values(characters));
      renderer.renderFurniture(furniture);
    });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const scaleX = 1920 / rect.width;
      const scaleY = 1080 / rect.height;
      renderer.handleMouseMove(
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top) * scaleY
      );
    };

    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      destroyed = true;
      container.removeEventListener("mousemove", handleMouseMove);
      renderer.destroy();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !room) return;
    renderer.renderObjects(room.objects);
    renderer.setLighting(room.lighting.warmth, room.lighting.brightness);
  }, [room]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.renderCharacters(Object.values(characters));
  }, [characters]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.renderFurniture(furniture);
  }, [furniture]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      aria-label="Eula room"
    />
  );
}
