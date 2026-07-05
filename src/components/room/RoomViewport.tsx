"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

const RoomCanvas = dynamic(
  () => import("./RoomCanvas").then((m) => m.RoomCanvas),
  { ssr: false, loading: () => <RoomLoadingState /> }
);

function RoomLoadingState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#1a1714]">
      <motion.div
        className="h-2 w-2 rounded-full bg-[#e8a87c]"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  );
}

export function RoomViewport() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const updateDimensions = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(vw, (vh * 16) / 9);
    const height = Math.min(vh, (vw * 9) / 16);
    setDimensions({ width, height });
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [updateDimensions]);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#0f0d0b]">
      <motion.div
        className="relative overflow-hidden shadow-2xl"
        style={{
          width: dimensions.width || "min(100vw, calc(100vh * 16 / 9))",
          height: dimensions.height || "min(100vh, calc(100vw * 9 / 16))",
        }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <RoomCanvas />
      </motion.div>
    </div>
  );
}
