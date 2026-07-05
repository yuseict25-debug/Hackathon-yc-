"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { MatchScreen } from "@/components/match/MatchScreen";
import { useCompatibility } from "@/hooks/useCompatibility";
import { useIdentity } from "@/hooks/useIdentity";
import { useSession } from "@/hooks/useSession";

function MatchPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") ?? undefined;
  useSession(sessionId ?? "");
  useCompatibility();
  const { traits, completeness } = useIdentity();

  if (!sessionId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#1a1714] via-[#1f1b17] to-[#141210] px-6 text-[#f5ebe0]">
        <p className="text-sm text-[#a89888]">
          Matching is scoped to a room. Open a room first.
        </p>
        <Link
          href="/room"
          className="text-sm text-[#e8a87c] underline-offset-4 hover:underline"
        >
          Go to your rooms
        </Link>
      </main>
    );
  }

  return (
    <MatchScreen
      sessionId={sessionId}
      traits={traits}
      completeness={completeness}
    />
  );
}

export default function MatchPage() {
  return (
    <RequireAuth>
      <MatchPageContent />
    </RequireAuth>
  );
}
