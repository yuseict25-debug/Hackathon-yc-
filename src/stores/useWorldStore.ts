import { create } from "zustand";

import { INITIAL_WORLD_BOUNDS } from "@/engine/world/worldBounds";
import { createWorldStoreActions, type WorldStore } from "./worldStore";

export const useWorldStore = create<WorldStore>((set, get) => ({
  bounds: { ...INITIAL_WORLD_BOUNDS },
  ...createWorldStoreActions(set, get),
}));
