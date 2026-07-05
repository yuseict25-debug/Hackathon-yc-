import { create } from "zustand";

import type { RoomStore } from "./roomStore";
import { createRoomStoreActions } from "./roomStore";

export const useRoomStore = create<RoomStore>((set, get) => ({
  room: null,
  isLoading: true,
  ...createRoomStoreActions(set, get),
}));
