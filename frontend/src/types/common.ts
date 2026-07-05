export interface Vector2 {
  x: number;
  y: number;
}

export interface RoomObject {
  id: string;
  type: RoomObjectType;
  position: Vector2;
  rotation: number;
  scale: Vector2;
  sprite: string;
  animation?: string;
  visibility: boolean;
  metadata?: Record<string, unknown>;
}

export type RoomObjectType =
  | "floor"
  | "wall"
  | "window"
  | "furniture"
  | "character"
  | "decoration";

export interface RoomLighting {
  warmth: number;
  brightness: number;
}

export interface RoomData {
  id: string;
  name: string;
  objects: RoomObject[];
  lighting: RoomLighting;
  atmosphere: string;
}
