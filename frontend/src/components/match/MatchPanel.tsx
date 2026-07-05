"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, X } from "lucide-react";

import { MatchScreen } from "@/components/match/MatchScreen";
import { useIdentity } from "@/hooks/useIdentity";
import { useCompatibilityStore } from "@/stores/useCompatibilityStore";

export function MatchPanel() {
  const isPanelOpen = useCompatibilityStore((s) => s.isPanelOpen);
  const togglePanel = useCompatibilityStore((s) => s.togglePanel);
  const resultStatus = useCompatibilityStore((s) => s.resultStatus);
  const { traits, completeness, sessionId } = useIdentity();

  return (
    <>
      <motion.button
        type="button"
        onClick={togglePanel}
        className="absolute left-6 top-[4.25rem] z-20 flex items-center gap-2 rounded-full border border-[#e8a87c]/20 bg-[#1a1714]/80 px-4 py-2 text-sm text-[#e8a87c] backdrop-blur-md transition-colors hover:bg-[#e8a87c]/10"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Toggle matching panel"
      >
        <Heart className="h-4 w-4" />
        <span className="font-light tracking-wide">Matches</span>
        {resultStatus === "success" && (
          <span className="h-1.5 w-1.5 rounded-full bg-[#a8d8a8]" />
        )}
      </motion.button>

      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            className="absolute left-6 top-[7.5rem] z-20 max-h-[min(70vh,520px)] w-96 overflow-y-auto rounded-2xl border border-[#e8a87c]/10 bg-[#1a1714]/95 p-5 shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <button
              type="button"
              onClick={togglePanel}
              className="absolute right-4 top-4 text-[#a89888] hover:text-[#f5ebe0]"
              aria-label="Close matches panel"
            >
              <X className="h-4 w-4" />
            </button>
            <MatchScreen
              sessionId={sessionId}
              traits={traits}
              completeness={completeness}
              compact
              onClose={togglePanel}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
