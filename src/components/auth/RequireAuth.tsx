"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuth();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="size-8 animate-pulse rounded-full bg-neutral-200" />
      </main>
    );
  }

  return children;
}
