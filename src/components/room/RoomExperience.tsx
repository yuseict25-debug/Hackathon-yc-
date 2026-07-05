"use client";

import { motion } from "framer-motion";

import { ConversationPanel } from "@/components/conversation/ConversationPanel";
import { IdentityPanel } from "@/components/identity/IdentityPanel";
import { RoomViewport } from "@/components/room/RoomViewport";
import { useCompatibility } from "@/hooks/useCompatibility";
import { useConversation } from "@/hooks/useConversation";
import { useFurniture } from "@/hooks/useFurniture";
import { useIdentity } from "@/hooks/useIdentity";
import { useProfile } from "@/hooks/useProfile";
import { useRoom } from "@/hooks/useRoom";

export function RoomExperience() {
  useRoom();
  useFurniture();
  useConversation();
  useIdentity();
  useCompatibility();
  useProfile();

  return (
    <motion.div
      className="fixed inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <RoomViewport />
      <IdentityPanel />
      <ConversationPanel />
    </motion.div>
  );
}
