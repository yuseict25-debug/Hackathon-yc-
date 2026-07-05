"use client";

import { useEffect } from "react";

import { fetchProfile } from "@/lib/api";
import { useProfileStore } from "@/stores/useProfileStore";

export function useProfile() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);

  useEffect(() => {
    if (profile) return;

    fetchProfile().then(setProfile);
  }, [profile, setProfile]);

  return { profile };
}
