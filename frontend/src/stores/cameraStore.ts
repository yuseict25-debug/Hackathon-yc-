import type { UserProfile } from "@/types/profile";

export interface CameraStore {
  offsetX: number;
  offsetY: number;
  zoom: number;
  parallaxStrength: number;
  targetOffsetX: number;
  targetOffsetY: number;
  setOffset: (x: number, y: number) => void;
  setTargetOffset: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;
  setParallaxStrength: (strength: number) => void;
}

export function createCameraStoreActions(
  set: (
    partial:
      | Partial<CameraStore>
      | ((state: CameraStore) => Partial<CameraStore>)
  ) => void
): Omit<
  CameraStore,
  "offsetX" | "offsetY" | "zoom" | "parallaxStrength" | "targetOffsetX" | "targetOffsetY"
> {
  return {
    setOffset: (offsetX, offsetY) => set({ offsetX, offsetY }),
    setTargetOffset: (targetOffsetX, targetOffsetY) =>
      set({ targetOffsetX, targetOffsetY }),
    setZoom: (zoom) => set({ zoom }),
    setParallaxStrength: (parallaxStrength) => set({ parallaxStrength }),
  };
}

export interface ProfileStore {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
}

export function createProfileStoreActions(
  set: (
    partial:
      | Partial<ProfileStore>
      | ((state: ProfileStore) => Partial<ProfileStore>)
  ) => void
): Omit<ProfileStore, "profile"> {
  return {
    setProfile: (profile) => set({ profile }),
  };
}
