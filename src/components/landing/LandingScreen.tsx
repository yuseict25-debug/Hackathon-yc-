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
    setTimeout(() => router.push("/login"), 600);
  };

  return (
    <motion.main
      className="fixed inset-0 flex flex-col items-center justify-center bg-white"
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
          <h1 className="relative text-6xl font-light tracking-[0.2em] text-neutral-800">
            Eula
          </h1>
        </div>

        <p className="max-w-md text-lg font-light tracking-wide text-neutral-500">
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
            className="mt-4 h-12 min-w-[160px] rounded-full border border-neutral-300 bg-neutral-100 px-8 text-base font-normal tracking-wider text-neutral-800 hover:bg-neutral-200"
          >
            Enter
          </Button>
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
