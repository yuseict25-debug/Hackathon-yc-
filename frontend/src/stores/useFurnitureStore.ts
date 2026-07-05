import { create } from "zustand";

import type { FurnitureStore } from "./furnitureStore";
import { createFurnitureStoreActions } from "./furnitureStore";

export const useFurnitureStore = create<FurnitureStore>((set, get) => ({
  items: [],
  ...createFurnitureStoreActions(set, get),
}));
