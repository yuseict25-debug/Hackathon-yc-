"use client";

import { useEffect } from "react";

import { fetchIdentity } from "@/lib/api";
import { useIdentityStore } from "@/stores/useIdentityStore";

export function useIdentity() {
  const traits = useIdentityStore((s) => s.traits);
  const completeness = useIdentityStore((s) => s.completeness);
  const isPanelOpen = useIdentityStore((s) => s.isPanelOpen);
  const setTraits = useIdentityStore((s) => s.setTraits);
  const setCompleteness = useIdentityStore((s) => s.setCompleteness);
  const togglePanel = useIdentityStore((s) => s.togglePanel);

  useEffect(() => {
    if (traits.length > 0) return;

    fetchIdentity().then((data) => {
      setTraits(data.traits);
      setCompleteness(data.completeness);
    });
  }, [traits.length, setTraits, setCompleteness]);

  return {
    traits,
    completeness,
    isPanelOpen,
    togglePanel,
  };
}
