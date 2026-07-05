import { create } from "zustand";

import type { CameraStore } from "./cameraStore";
import { createCameraStoreActions } from "./cameraStore";

export const useCameraStore = create<CameraStore>((set) => ({
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
  parallaxStrength: 0.02,
  targetOffsetX: 0,
  targetOffsetY: 0,
  ...createCameraStoreActions(set),
}));
