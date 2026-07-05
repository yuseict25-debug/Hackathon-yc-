import { create } from "zustand";

import { createSceneStoreActions, type SceneStore } from "./sceneStore";

export const useSceneStore = create<SceneStore>((set) => ({
  roomState: null,
  appliedRevision: null,
  movementControl: "player",
  ...createSceneStoreActions(set),
}));
