export const BASE_WIDTH = 1920;
export const BASE_HEIGHT = 1080;
export const ASPECT_RATIO = BASE_WIDTH / BASE_HEIGHT;

export const ROOM_COLORS = {
  background: 0x1e1a17,
  floor: 0x3d342c,
  floorAccent: 0x4a4038,
  wall: 0x5c5248,
  wallLight: 0x6b6055,
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
