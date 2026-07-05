"use client";

import { motion } from "framer-motion";

export function RoomLoadingScreen() {
  return (
    <motion.main
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute -inset-8 rounded-full bg-[#e8a87c]/10 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <p className="relative text-sm font-light tracking-[0.25em] text-neutral-500">
        Preparing your room…
      </p>
      <div className="relative mt-6 size-8 animate-spin rounded-full border-2 border-neutral-200 border-t-[#e8a87c]" />
    </motion.main>
  );
}
