import { useCompatibilityStore } from "@/stores/useCompatibilityStore";
import { useConversationStore } from "@/stores/useConversationStore";
import { useFurnitureStore } from "@/stores/useFurnitureStore";
import { useIdentityStore } from "@/stores/useIdentityStore";
import { useSceneStore } from "@/stores/useSceneStore";
import { useWorldStore } from "@/stores/useWorldStore";

/** Clear client room state when switching sessions */
export function resetSessionClientState(): void {
  useConversationStore.setState({
    messages: [],
    isTyping: false,
    isSpeaking: false,
    isDeliveringResponse: false,
    aiTone: null,
    isBuilding: false,
  });
  useFurnitureStore.setState({ items: [] });
  useIdentityStore.getState().resetIdentityState();
  useCompatibilityStore.getState().resetMatchState();
  useSceneStore.getState().clearRoomState();
  useWorldStore.getState().resetBounds();
}
