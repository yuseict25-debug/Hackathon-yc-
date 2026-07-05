"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { Button } from "@/components/ui/button";
import { createChatSession, listChatSessions, type ChatSession } from "@/lib/api";

export default function RoomListPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await listChatSessions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openNew = async () => {
    setCreating(true);
    try {
      const session = await createChatSession(`Room ${sessions.length + 1}`);
      router.push(`/room/${session.session_id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <RequireAuth>
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white px-6">
        <div className="text-center">
          <h1 className="text-3xl font-light tracking-wide text-neutral-800">
            Your rooms
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Open an existing room or start a new one
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col gap-2">
          {loading ? (
            <p className="text-center text-sm text-neutral-400">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="text-center text-sm text-neutral-400">
              No rooms yet — create your first one
            </p>
          ) : (
            sessions.map((session) => (
              <Link
                key={session.session_id}
                href={`/room/${session.session_id}`}
                className="rounded-xl border border-neutral-200 px-4 py-3 text-neutral-800 transition-colors hover:bg-neutral-50"
              >
                <span className="block font-medium">
                  {session.title ?? "Untitled room"}
                </span>
                {session.created_at && (
                  <span className="text-xs text-neutral-400">
                    {new Date(session.created_at).toLocaleString()}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>

        <Button
          onClick={openNew}
          disabled={creating}
          className="rounded-full px-8"
        >
          {creating ? "Creating…" : "New room"}
        </Button>
      </main>
    </RequireAuth>
  );
}
