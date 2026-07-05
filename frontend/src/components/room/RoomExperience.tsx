"use client";

import { AnimatePresence, motion } from "framer-motion";

import { ConversationPanel } from "@/components/conversation/ConversationPanel";
import { IdentityPanel } from "@/components/identity/IdentityPanel";
import { MatchPanel } from "@/components/match/MatchPanel";
import { RoomExitButton } from "@/components/room/RoomExitButton";
import { RoomLoadingScreen } from "@/components/room/RoomLoadingScreen";
import { RoomViewport } from "@/components/room/RoomViewport";
import { useCompatibility } from "@/hooks/useCompatibility";
import { useConversation } from "@/hooks/useConversation";
import { useEulaVisibility } from "@/hooks/useEulaVisibility";
import { usePlayerConversationAnimation } from "@/hooks/usePlayerConversationAnimation";
import { usePlayerMovement } from "@/hooks/usePlayerMovement";
import { usePlayerStance } from "@/hooks/usePlayerStance";
import { useFurniture } from "@/hooks/useFurniture";
import { useIdentity } from "@/hooks/useIdentity";
import { useProfile } from "@/hooks/useProfile";
import { useRoom } from "@/hooks/useRoom";
import { useRoomReady } from "@/hooks/useRoomReady";
import { useRoomState } from "@/hooks/useRoomState";
import { useSession } from "@/hooks/useSession";

export function RoomExperience({ sessionId }: { sessionId: string }) {
  useSession(sessionId);
  useRoom();
  useRoomState();
  useFurniture();
  useConversation();
  usePlayerConversationAnimation();
  useEulaVisibility();
  usePlayerMovement();
  usePlayerStance();
  useIdentity();
  useCompatibility();
  useProfile();

  const { isReady } = useRoomReady(sessionId);

  return (
    <>
      <AnimatePresence>
        {!isReady && <RoomLoadingScreen key="loading" />}
      </AnimatePresence>

      {isReady && (
        <motion.div
          className="fixed inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <RoomViewport />
          <RoomExitButton />
          <IdentityPanel />
          <MatchPanel />
          <ConversationPanel />
        </motion.div>
      )}
    </>
  );
}
