import { BASE_HEIGHT, BASE_WIDTH } from "@/engine/constants";

export interface WorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Starting playable area — matches default room footprint on canvas */
export const INITIAL_WORLD_BOUNDS: WorldBounds = {
  minX: 400,
  maxX: 1520,
  minY: 180,
  maxY: 900,
};

export const WORLD_EDGE_THRESHOLD = 80;
export const WORLD_EXPANSION_STEP = 160;
export const MIN_CAMERA_ZOOM = 0.52;
export const CAMERA_ZOOM_PADDING = 0.88;

export function clampToBounds(
  x: number,
  y: number,
  bounds: WorldBounds
): { x: number; y: number } {
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, y)),
  };
}

export function expandBoundsForPosition(
  x: number,
  y: number,
  bounds: WorldBounds
): WorldBounds {
  let { minX, maxX, minY, maxY } = bounds;

  if (x - minX < WORLD_EDGE_THRESHOLD) {
    minX -= WORLD_EXPANSION_STEP;
  }
  if (maxX - x < WORLD_EDGE_THRESHOLD) {
    maxX += WORLD_EXPANSION_STEP;
  }
  if (y - minY < WORLD_EDGE_THRESHOLD) {
    minY -= WORLD_EXPANSION_STEP;
  }
  if (maxY - y < WORLD_EDGE_THRESHOLD) {
    maxY += WORLD_EXPANSION_STEP;
  }

  return { minX, maxX, minY, maxY };
}

export function getWorldSize(bounds: WorldBounds): {
  width: number;
  height: number;
} {
  return {
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
}

export function boundsChanged(a: WorldBounds, b: WorldBounds): boolean {
  return (
    a.minX !== b.minX ||
    a.maxX !== b.maxX ||
    a.minY !== b.minY ||
    a.maxY !== b.maxY
  );
}
