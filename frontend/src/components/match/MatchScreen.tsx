"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Heart, Loader2, Sparkles, Users } from "lucide-react";
import Link from "next/link";

import { MatchCard } from "@/components/match/MatchCard";
import { Button } from "@/components/ui/button";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import type { IdentityTrait } from "@/types/identity";

interface MatchScreenProps {
  sessionId: string | null | undefined;
  traits: IdentityTrait[];
  completeness: number;
  /** Compact layout for in-room panel */
  compact?: boolean;
  onClose?: () => void;
}

export function MatchScreen({
  sessionId,
  traits,
  completeness,
  compact = false,
  onClose,
}: MatchScreenProps) {
  const {
    status,
    resultStatus,
    message,
    matches,
    personality,
    analyzedAt,
    errorMessage,
    canAnalyze,
    runAnalysis,
    reset,
  } = useMatchmaking(sessionId, traits, completeness);

  const traitLabels = traits.map((t) => t.label);
  const hasMatch = resultStatus === "success" && matches.length > 0;
  const showInsufficient =
    status === "ready" && resultStatus === "insufficient_data";
  const showNoMatch = status === "ready" && resultStatus === "no_match";
  const showResults = hasMatch;

  return (
    <div
      className={
        compact
          ? "flex flex-col"
          : "flex min-h-screen flex-col bg-gradient-to-b from-[#1a1714] via-[#1f1b17] to-[#141210] text-[#f5ebe0]"
      }
    >
      {!compact && (
        <header className="flex items-center justify-between px-6 py-5">
          <Link
            href="/room"
            className="flex items-center gap-2 text-sm text-[#a89888] transition-colors hover:text-[#f5ebe0]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to rooms
          </Link>
          <div className="flex items-center gap-2 text-[#e8a87c]">
            <Heart className="h-4 w-4" />
            <span className="text-sm font-light tracking-wide">Matching</span>
          </div>
        </header>
      )}

      {compact && (
        <div className="mb-4 flex items-center justify-between border-b border-[#e8a87c]/10 pb-3">
          <div>
            <h2 className="text-sm font-medium text-[#f5ebe0]">Your matches</h2>
            <p className="text-xs text-[#a89888]">Personality pairing</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#a89888] hover:text-[#f5ebe0]"
            >
              Close
            </button>
          )}
        </div>
      )}

      <div
        className={
          compact
            ? "flex flex-col gap-4"
            : "mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 pb-10"
        }
      >
        {/* Personality snapshot */}
        <section className="rounded-2xl border border-[#e8a87c]/10 bg-[#2a2520]/40 p-5">
          <div className="mb-3 flex items-center gap-2 text-[#e8a87c]">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-widest">
              Your personality
            </span>
          </div>

          {personality?.headline && showResults ? (
            <p className="mb-3 text-lg font-light leading-snug text-[#f5ebe0]">
              {personality.headline}
            </p>
          ) : (
            <p className="mb-3 text-sm leading-relaxed text-[#a89888]">
              We read your conversations in this room, build a personality profile,
              and find someone on a similar wavelength.
            </p>
          )}

          <div className="mb-3">
            <div className="mb-1 flex justify-between text-xs text-[#a89888]">
              <span>Identity understood</span>
              <span>{Math.round(completeness * 100)}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[#1a1714]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#e8a87c] to-[#7eb8da]"
                style={{ width: `${Math.min(100, completeness * 100)}%` }}
              />
            </div>
          </div>

          {traitLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {traitLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-[#1a1714]/80 px-2.5 py-1 text-xs text-[#c4b8a8]"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Action / status */}
        <AnimatePresence mode="wait">
          {status === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 rounded-2xl border border-[#e8a87c]/10 bg-[#2a2520]/30 py-10"
            >
              <Loader2 className="h-8 w-8 animate-spin text-[#e8a87c]" />
              <div className="text-center">
                <p className="text-sm font-medium text-[#f5ebe0]">
                  Analyzing your personality…
                </p>
                <p className="mt-1 text-xs text-[#a89888]">
                  Finding people who match your vibe
                </p>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-red-900/30 bg-red-950/20 p-4 text-center"
            >
              <p className="text-sm text-red-200/90">{errorMessage}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-[#e8a87c]/20 bg-transparent text-[#f5ebe0]"
                onClick={() => {
                  reset();
                  void runAnalysis();
                }}
              >
                Try again
              </Button>
            </motion.div>
          )}

          {showInsufficient && (
            <motion.div
              key="insufficient"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-[#e8a87c]/15 bg-[#2a2520]/40 p-5 text-center"
            >
              <p className="text-sm text-[#f5ebe0]">
                {message ?? "Not enough info — you need more interaction"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-[#e8a87c]/20 bg-transparent text-[#f5ebe0]"
                onClick={() => {
                  reset();
                  void runAnalysis();
                }}
              >
                Try again
              </Button>
            </motion.div>
          )}

          {showNoMatch && (
            <motion.div
              key="no-match"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-[#e8a87c]/15 bg-[#2a2520]/40 p-5 text-center"
            >
              <p className="text-sm text-[#f5ebe0]">
                {message ?? "No strong match yet — keep chatting in this room."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-[#e8a87c]/20 bg-transparent text-[#f5ebe0]"
                onClick={() => {
                  reset();
                  void runAnalysis();
                }}
              >
                Re-analyze
              </Button>
            </motion.div>
          )}

          {!showResults &&
            !showInsufficient &&
            !showNoMatch &&
            status !== "analyzing" &&
            status !== "error" && (
            <motion.div key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button
                onClick={() => void runAnalysis()}
                disabled={!canAnalyze}
                className="h-12 w-full rounded-full bg-[#e8a87c] text-base font-normal tracking-wide text-[#1a1714] hover:bg-[#d9976b] disabled:opacity-40"
              >
                <Users className="mr-2 h-4 w-4" />
                Find my match
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {showResults && (
          <section className="flex flex-col gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-[#a8d8a8]/30 bg-[#a8d8a8]/10 px-5 py-4 text-center"
            >
              <p className="text-lg font-medium text-[#a8d8a8]">
                {message ?? "It's a match!"}
              </p>
            </motion.div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-[#f5ebe0]">
                Your match
              </h2>
              {analyzedAt && (
                <span className="text-[10px] text-[#6a6058]">
                  {new Date(analyzedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {matches.map((match, i) => (
              <MatchCard key={match.id} match={match} rank={i + 1} index={i} />
            ))}

            <Button
              variant="outline"
              onClick={() => {
                reset();
                void runAnalysis();
              }}
              className="mt-2 border-[#e8a87c]/20 bg-transparent text-[#a89888] hover:bg-[#2a2520]/60 hover:text-[#f5ebe0]"
            >
              Re-analyze
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
