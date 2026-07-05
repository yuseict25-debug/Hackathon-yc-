"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function LandingScreen() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(() => router.push("/room"), 600);
  };

  return (
    <motion.main
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#1a1714]"
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.div
        className="flex flex-col items-center gap-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      >
        <div className="relative">
          <motion.div
            className="absolute -inset-8 rounded-full bg-[#e8a87c]/10 blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <h1 className="relative text-6xl font-light tracking-[0.2em] text-[#f5ebe0]">
            Eula
          </h1>
        </div>

        <p className="max-w-md text-lg font-light tracking-wide text-[#a89888]">
          Discover who you are.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button
            onClick={handleEnter}
            size="lg"
            className="mt-4 h-12 min-w-[160px] rounded-full border border-[#e8a87c]/30 bg-[#e8a87c]/10 px-8 text-base font-normal tracking-wider text-[#f5ebe0] hover:bg-[#e8a87c]/20"
          >
            Enter
          </Button>
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
