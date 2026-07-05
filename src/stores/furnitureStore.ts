import type { FurnitureItem } from "@/types/furniture";

export interface FurnitureStore {
  items: FurnitureItem[];
  setItems: (items: FurnitureItem[]) => void;
  addItem: (item: FurnitureItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<FurnitureItem>) => void;
}

export function createFurnitureStoreActions(
  set: (
    partial:
      | Partial<FurnitureStore>
      | ((state: FurnitureStore) => Partial<FurnitureStore>)
  ) => void,
  get: () => FurnitureStore
): Omit<FurnitureStore, "items"> {
  return {
    setItems: (items) => set({ items }),
    addItem: (item) => set((state) => ({ items: [...state.items, item] })),
    removeItem: (id) =>
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      })),
    updateItem: (id, updates) => {
      const { items } = get();
      set({
        items: items.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      });
    },
  };
}
