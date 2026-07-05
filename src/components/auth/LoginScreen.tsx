"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/hooks/useAuth";

export function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, isLoading } = useAuth();

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/room");
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated || isAuthenticated) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="size-8 animate-pulse rounded-full bg-neutral-200" />
      </main>
    );
  }

  return (
    <motion.main
      className="fixed inset-0 flex flex-col items-center justify-center bg-white px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.div
        className="flex w-full max-w-sm flex-col items-center gap-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
      >
        <div className="relative">
          <motion.div
            className="absolute -inset-8 rounded-full bg-[#e8a87c]/10 blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <h1 className="relative text-5xl font-light tracking-[0.2em] text-neutral-800">
            Eula
          </h1>
        </div>

        <div className="space-y-2">
          <p className="text-lg font-light tracking-wide text-neutral-600">
            Sign in to continue
          </p>
          <p className="text-sm font-light text-neutral-400">
            Use your Google account to enter your room
          </p>
        </div>

        <div className="w-full">
          <GoogleSignInButton />
        </div>

        {isLoading && (
          <p className="text-sm text-neutral-400">Signing you in…</p>
        )}
      </motion.div>
    </motion.main>
  );
}
