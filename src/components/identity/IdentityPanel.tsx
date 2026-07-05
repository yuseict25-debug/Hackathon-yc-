"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

import { useIdentity } from "@/hooks/useIdentity";

const CATEGORY_COLORS: Record<string, string> = {
  personality: "#e8a87c",
  interests: "#7eb8da",
  values: "#a8d8a8",
  habits: "#c4a882",
  communication: "#b8a8d8",
};

export function IdentityPanel() {
  const { traits, completeness, isPanelOpen, togglePanel } = useIdentity();

  return (
    <>
      <motion.button
        onClick={togglePanel}
        className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-full border border-[#e8a87c]/20 bg-[#1a1714]/80 px-4 py-2 text-sm text-[#e8a87c] backdrop-blur-md transition-colors hover:bg-[#e8a87c]/10"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Toggle identity panel"
      >
        <Sparkles className="h-4 w-4" />
        <span className="font-light tracking-wide">Identity</span>
        <span className="text-xs text-[#a89888]">
          {Math.round(completeness * 100)}%
        </span>
      </motion.button>

      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            className="absolute left-6 top-20 z-20 w-80 overflow-hidden rounded-2xl border border-[#e8a87c]/10 bg-[#1a1714]/90 shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between border-b border-[#e8a87c]/10 px-5 py-4">
              <div>
                <h2 className="text-sm font-medium text-[#f5ebe0]">
                  Identity Engine
                </h2>
                <p className="text-xs text-[#a89888]">
                  Learned through conversation
                </p>
              </div>
              <button
                onClick={togglePanel}
                className="text-[#a89888] transition-colors hover:text-[#f5ebe0]"
                aria-label="Close identity panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="mb-4">
                <div className="mb-1.5 flex justify-between text-xs text-[#a89888]">
                  <span>Understanding</span>
                  <span>{Math.round(completeness * 100)}%</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-[#2a2520]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#e8a87c] to-[#7eb8da]"
                    initial={{ width: 0 }}
                    animate={{ width: `${completeness * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="flex max-h-64 flex-col gap-3 overflow-y-auto">
                {traits.map((trait, index) => (
                  <motion.div
                    key={trait.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-xl bg-[#2a2520]/60 p-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm text-[#f5ebe0]">
                        {trait.label}
                      </span>
                      <span
                        className="text-xs capitalize"
                        style={{
                          color:
                            CATEGORY_COLORS[trait.category] ?? "#a89888",
                        }}
                      >
                        {trait.category}
                      </span>
                    </div>
                    <p className="mb-2 text-xs leading-relaxed text-[#a89888]">
                      {trait.description}
                    </p>
                    <div className="h-0.5 overflow-hidden rounded-full bg-[#1a1714]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${trait.value * 100}%`,
                          backgroundColor:
                            CATEGORY_COLORS[trait.category] ?? "#a89888",
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
