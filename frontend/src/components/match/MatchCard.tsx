"use client";

import { motion } from "framer-motion";

import type { CompatibilityMatch, MatchType } from "@/types/compatibility";

const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  friendship: "Friend",
  cofounder: "Co-founder",
  teammate: "Teammate",
  mentor: "Mentor",
  roommate: "Roommate",
  relationship: "Partner",
  community: "Community",
};

function scoreColor(score: number): string {
  if (score >= 0.85) return "#a8d8a8";
  if (score >= 0.7) return "#e8a87c";
  return "#7eb8da";
}

interface MatchCardProps {
  match: CompatibilityMatch;
  rank: number;
  index?: number;
}

export function MatchCard({ match, rank, index = 0 }: MatchCardProps) {
  const pct = Math.round(match.compatibilityScore * 100);
  const accent = match.avatarColor ?? scoreColor(match.compatibilityScore);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className="rounded-2xl border border-[#e8a87c]/10 bg-[#2a2520]/60 p-4"
    >
      <div className="mb-3 flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-medium text-[#1a1714]"
          style={{ backgroundColor: accent }}
        >
          {match.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-base font-medium text-[#f5ebe0]">
              {match.name}
            </h3>
            <span className="shrink-0 text-xs text-[#a89888]">#{rank}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span
              className="text-xs font-medium"
              style={{ color: accent }}
            >
              {pct}% match
            </span>
            <span className="text-xs text-[#6a6058]">·</span>
            <span className="text-xs capitalize text-[#a89888]">
              {MATCH_TYPE_LABELS[match.matchType]}
            </span>
            {match.vibe && (
              <>
                <span className="text-xs text-[#6a6058]">·</span>
                <span className="text-xs text-[#a89888]">{match.vibe}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="mb-3 text-sm leading-relaxed text-[#c4b8a8]">
        {match.summary}
      </p>

      <div className="mb-2 h-1 overflow-hidden rounded-full bg-[#1a1714]">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: accent }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.2 + index * 0.08, duration: 0.6 }}
        />
      </div>

      {match.sharedTraits.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {match.sharedTraits.map((trait) => (
            <span
              key={trait}
              className="rounded-full border border-[#e8a87c]/15 bg-[#1a1714]/80 px-2 py-0.5 text-[10px] tracking-wide text-[#a89888]"
            >
              {trait}
            </span>
          ))}
        </div>
      )}
    </motion.article>
  );
}

export { MATCH_TYPE_LABELS };
