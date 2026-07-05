import { Graphics } from "pixi.js";

import { ROOM_COLORS } from "@/engine/constants";
import type { WorldBounds } from "@/engine/world/worldBounds";

const FLOOR_LINE_SPACING = 160;

export interface SceneFloorColors {
  background: number;
  floor: number;
  floorAccent: number;
}

export const DEFAULT_SCENE_FLOOR_COLORS: SceneFloorColors = {
  background: ROOM_COLORS.background,
  floor: ROOM_COLORS.floor,
  floorAccent: ROOM_COLORS.floorAccent,
};

/** Floor that grows with expandable world bounds */
export function drawExpandableFloor(
  graphics: Graphics,
  bounds: WorldBounds,
  colors: SceneFloorColors = DEFAULT_SCENE_FLOOR_COLORS
): void {
  graphics.clear();

  const floorTop = bounds.minY + (bounds.maxY - bounds.minY) * 0.45;
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - floorTop;

  graphics.rect(bounds.minX, floorTop, width, height);
  graphics.fill(colors.floor);

  const lineCount = Math.ceil(width / FLOOR_LINE_SPACING) + 2;
  const startX = bounds.minX - FLOOR_LINE_SPACING;

  for (let i = 0; i < lineCount; i++) {
    const x = startX + i * FLOOR_LINE_SPACING;
    graphics.moveTo(x, floorTop);
    graphics.lineTo(x - 80, bounds.maxY);
    graphics.stroke({ width: 1, color: colors.floorAccent, alpha: 0.3 });
  }
}

/** Subtle world backdrop behind the floor */
export function drawWorldBackdrop(
  graphics: Graphics,
  bounds: WorldBounds,
  backgroundColor: number = ROOM_COLORS.background
): void {
  graphics.clear();
  graphics.rect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  graphics.fill(backgroundColor);
}
