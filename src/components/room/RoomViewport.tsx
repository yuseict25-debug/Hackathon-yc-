"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

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
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#0f0d0b]">
      <div
        className="relative overflow-hidden shadow-2xl"
        style={{
          width: "min(100vw, calc(100vh * 16 / 9))",
          height: "min(100vh, calc(100vw * 9 / 16))",
        }}
      >
        <RoomCanvas />
      </div>
    </div>
  );
}
