import { BASE_HEIGHT, BASE_WIDTH } from "@/engine/constants";
import type { RoomObject } from "@/types/common";
import type { FurnitureItem } from "@/types/furniture";
import type { WorldBounds } from "@/engine/world/worldBounds";
import {
  CAMERA_ZOOM_PADDING,
  MIN_CAMERA_ZOOM,
} from "@/engine/world/worldBounds";

/** Player spawn — camera zooms in as they return here */
export const PLAYER_ORIGIN = { x: 960, y: 700 } as const;

/** Default framing around origin — cozy but a bit roomier */
export const HOME_BOUNDS_BASE: WorldBounds = {
  minX: PLAYER_ORIGIN.x - 380,
  maxX: PLAYER_ORIGIN.x + 380,
  minY: PLAYER_ORIGIN.y - 280,
  maxY: PLAYER_ORIGIN.y + 220,
};

export const HOME_CONTENT_PADDING = 140;
export const DEFAULT_OBJECT_RADIUS = 100;
export const ORIGIN_ZOOM_INFLUENCE_RADIUS = 720;
export const ORIGIN_CLOSE_ZOOM_RADIUS = 160;

export interface CameraFollowInput {
  playerX: number;
  playerY: number;
  worldBounds: WorldBounds;
  homeBounds: WorldBounds;
}

export function distanceToOrigin(x: number, y: number): number {
  const dx = x - PLAYER_ORIGIN.x;
  const dy = y - PLAYER_ORIGIN.y;
  return Math.hypot(dx, dy);
}

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function unionBounds(a: WorldBounds, b: WorldBounds): WorldBounds {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function expandAroundPoint(
  bounds: WorldBounds,
  x: number,
  y: number,
  radius: number
): WorldBounds {
  return unionBounds(bounds, {
    minX: x - radius,
    minY: y - radius,
    maxX: x + radius,
    maxY: y + radius,
  });
}

/** Grows the home framing area as furniture and room objects appear near the origin */
export function computeHomeBounds(
  furniture: FurnitureItem[],
  roomObjects: RoomObject[] = []
): WorldBounds {
  let bounds: WorldBounds = { ...HOME_BOUNDS_BASE };

  bounds = expandAroundPoint(
    bounds,
    PLAYER_ORIGIN.x,
    PLAYER_ORIGIN.y,
    HOME_CONTENT_PADDING
  );

  const placables = [
    ...furniture.filter((item) => item.visibility),
    ...roomObjects.filter(
      (obj) =>
        obj.visibility &&
        obj.type !== "floor" &&
        obj.type !== "wall" &&
        obj.type !== "character"
    ),
  ];

  for (const item of placables) {
    const radius =
      (item.metadata?.boundsRadius as number | undefined) ?? DEFAULT_OBJECT_RADIUS;
    bounds = expandAroundPoint(
      bounds,
      item.position.x,
      item.position.y,
      radius * Math.max(item.scale.x, item.scale.y, 1)
    );
  }

  return bounds;
}

export function zoomToFitBounds(bounds: WorldBounds): number {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  if (width <= 0 || height <= 0) return 1;

  return Math.min(
    (BASE_WIDTH / width) * CAMERA_ZOOM_PADDING,
    (BASE_HEIGHT / height) * CAMERA_ZOOM_PADDING,
    1
  );
}

/**
 * Near origin → zoom in (up to 1×, or out slightly to fit home objects).
 * Far from origin → zoom out to fit the expanded world.
 */
export function computeCameraZoom(input: CameraFollowInput): number {
  const { playerX, playerY, worldBounds, homeBounds } = input;

  const homeZoom = zoomToFitBounds(homeBounds);
  const exploreZoom = zoomToFitBounds(worldBounds);

  const dist = distanceToOrigin(playerX, playerY);
  const proximity = smoothstep(1 - dist / ORIGIN_ZOOM_INFLUENCE_RADIUS);

  let targetZoom = exploreZoom + (homeZoom - exploreZoom) * proximity;

  if (dist < ORIGIN_CLOSE_ZOOM_RADIUS) {
    const closeT = smoothstep(1 - dist / ORIGIN_CLOSE_ZOOM_RADIUS);
    targetZoom = targetZoom + (1 - targetZoom) * closeT;
  }

  return Math.max(MIN_CAMERA_ZOOM, Math.min(1, targetZoom));
}
