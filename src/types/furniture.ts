import type { RoomObject } from "./common";

export type FurnitureCategory =
  | "desk"
  | "chair"
  | "plant"
  | "book"
  | "technology"
  | "travel"
  | "music"
  | "sports"
  | "art"
  | "decoration"
  | "other";

export interface FurnitureItem extends RoomObject {
  category: FurnitureCategory;
  unlockedAt?: string;
  source?: string;
}
