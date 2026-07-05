import { Graphics } from "pixi.js";

import { ROOM_COLORS } from "@/engine/constants";
import type { WorldBounds } from "@/engine/world/worldBounds";

export interface SceneFloorColors {
  background: number;
  floor: number;
  floorAccent: number;
}

export const DEFAULT_SCENE_FLOOR_COLORS: SceneFloorColors = {
  background: ROOM_COLORS.background,
  floor: ROOM_COLORS.floor,
  floorAccent: ROOM_COLORS.floor,
};

/** Single flat floor fill — no perspective lines or two-tone regions */
export function drawExpandableFloor(
  graphics: Graphics,
  bounds: WorldBounds,
  colors: SceneFloorColors = DEFAULT_SCENE_FLOOR_COLORS
): void {
  graphics.clear();
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  graphics.rect(bounds.minX, bounds.minY, width, height);
  graphics.fill(colors.floor);
}

/** Unified backdrop — same color as the floor for a seamless room */
export function drawWorldBackdrop(
  graphics: Graphics,
  bounds: WorldBounds,
  backgroundColor: number = ROOM_COLORS.background
): void {
  graphics.clear();
  graphics.rect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  graphics.fill(backgroundColor);
}
