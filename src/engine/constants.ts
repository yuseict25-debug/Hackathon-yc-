export const BASE_WIDTH = 1920;
export const BASE_HEIGHT = 1080;
export const ASPECT_RATIO = BASE_WIDTH / BASE_HEIGHT;

export const ROOM_COLORS = {
  background: 0xffffff,
  floor: 0xffffff,
  floorAccent: 0xf0f0f0,
  wall: 0xffffff,
  wallLight: 0xffffff,
  window: 0x87a8c4,
  windowFrame: 0x4a4038,
  windowGlow: 0xf5e6c8,
} as const;

export const CHARACTER_COLORS = {
  player: 0x7eb8da,
  eula: 0xe8a87c,
} as const;

export const FURNITURE_COLORS = {
  desk: 0x6b5344,
  chair: 0x5a4a3a,
  plant: 0x5a8f5a,
  pot: 0x8b6914,
} as const;

/** Scale for pixel art sprites on the 1920×1080 canvas */
export const PLAYER_SPRITE_SCALE = 0.595;
export const EULA_SPRITE_SCALE = 0.85;

/** @deprecated use PLAYER_SPRITE_SCALE / EULA_SPRITE_SCALE */
export const CHARACTER_SPRITE_SCALE = PLAYER_SPRITE_SCALE;

export const PLAYER_SPEED = 6.75;

/** @deprecated use INITIAL_WORLD_BOUNDS from engine/world/worldBounds */
export const PLAYER_BOUNDS = {
  minX: 100,
  maxX: BASE_WIDTH - 100,
  minY: 250,
  maxY: BASE_HEIGHT - 80,
} as const;
