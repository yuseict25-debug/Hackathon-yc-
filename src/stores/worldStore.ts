import type { WorldBounds } from "@/engine/world/worldBounds";
import {
  INITIAL_WORLD_BOUNDS,
  boundsChanged,
  expandBoundsForPosition,
} from "@/engine/world/worldBounds";

export interface WorldStore {
  bounds: WorldBounds;
  expandForPosition: (x: number, y: number) => void;
  setBounds: (bounds: WorldBounds) => void;
  resetBounds: () => void;
}

export function createWorldStoreActions(
  set: (
    partial: Partial<WorldStore> | ((state: WorldStore) => Partial<WorldStore>)
  ) => void,
  get: () => WorldStore
): Pick<WorldStore, "expandForPosition" | "setBounds" | "resetBounds"> {
  return {
    expandForPosition: (x, y) => {
      const next = expandBoundsForPosition(x, y, get().bounds);
      if (boundsChanged(get().bounds, next)) {
        set({ bounds: next });
      }
    },
    setBounds: (bounds) => set({ bounds: { ...bounds } }),
    resetBounds: () => set({ bounds: { ...INITIAL_WORLD_BOUNDS } }),
  };
}
