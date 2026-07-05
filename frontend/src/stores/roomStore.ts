import type { RoomData, RoomObject } from "@/types/common";

export interface RoomStore {
  room: RoomData | null;
  isLoading: boolean;
  setRoom: (room: RoomData) => void;
  setLoading: (loading: boolean) => void;
  updateObject: (id: string, updates: Partial<RoomObject>) => void;
  addObject: (object: RoomObject) => void;
  removeObject: (id: string) => void;
}

export function createRoomStoreActions(
  set: (
    partial:
      | Partial<RoomStore>
      | ((state: RoomStore) => Partial<RoomStore>)
  ) => void,
  get: () => RoomStore
): Omit<
  RoomStore,
  "room" | "isLoading"
> {
  return {
    setRoom: (room) => set({ room }),
    setLoading: (isLoading) => set({ isLoading }),
    updateObject: (id, updates) => {
      const { room } = get();
      if (!room) return;
      set({
        room: {
          ...room,
          objects: room.objects.map((obj) =>
            obj.id === id ? { ...obj, ...updates } : obj
          ),
        },
      });
    },
    addObject: (object) => {
      const { room } = get();
      if (!room) return;
      set({
        room: {
          ...room,
          objects: [...room.objects, object],
        },
      });
    },
    removeObject: (id) => {
      const { room } = get();
      if (!room) return;
      set({
        room: {
          ...room,
          objects: room.objects.filter((obj) => obj.id !== id),
        },
      });
    },
  };
}
