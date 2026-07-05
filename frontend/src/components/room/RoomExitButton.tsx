"use client";

import { motion } from "framer-motion";
import { DoorOpen } from "lucide-react";
import Link from "next/link";

export function RoomExitButton() {
  return (
    <motion.div
      className="absolute right-6 top-6 z-20"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link
        href="/room"
        className="inline-flex items-center gap-2 rounded-full border border-[#e8a87c]/20 bg-[#1a1714]/80 px-4 py-2 text-sm text-[#f5ebe0] backdrop-blur-md transition-colors hover:bg-[#e8a87c]/10"
      >
        <DoorOpen className="h-4 w-4 text-[#e8a87c]" />
        Exit to rooms
      </Link>
    </motion.div>
  );
}
