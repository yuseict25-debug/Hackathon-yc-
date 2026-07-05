import { create } from "zustand";

import type { ProfileStore } from "./cameraStore";
import { createProfileStoreActions } from "./cameraStore";

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  ...createProfileStoreActions(set),
}));
