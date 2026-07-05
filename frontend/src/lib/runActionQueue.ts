import { CharacterAssetLoader } from "@/engine/pixi/CharacterAssetLoader";
import { walkPlayerHome, walkPlayerTo } from "@/engine/player/walkToPosition";
import type { AiMessageResponse, ActionStep, CharacterTonePayload } from "@/types/characterTone";
import type { PlayerMovementKey } from "@/types/characterAnimations";
import { useCharacterStore } from "@/stores/useCharacterStore";
import { useSceneStore } from "@/stores/useSceneStore";

const VALID_STANCES = new Set<string>([
  "happy",
  "sad",
  "laugh",
  "surprised",
  "wave",
  "confused",
  "thinking",
  "talking",
  "up",
  "down",
  "left",
  "right",
]);

export interface RunActionQueueOptions {
  steps: ActionStep[];
  tone: CharacterTonePayload;
  applyTone: (tone: CharacterTonePayload) => Promise<void>;
  applySceneUpdates: (response: AiMessageResponse) => void;
  onBuild: () => Promise<AiMessageResponse>;
  appendEulaMessage: (msg: AiMessageResponse) => void;
  setBuilding: (building: boolean) => void;
  setTyping: (typing: boolean) => void;
}

export async function runActionQueue({
  steps,
  tone,
  applyTone,
  applySceneUpdates,
  onBuild,
  appendEulaMessage,
  setBuilding,
  setTyping,
}: RunActionQueueOptions): Promise<void> {
  for (const step of steps) {
    switch (step.type) {
      case "walk": {
        await applyTone({ ...tone, animation: "walking", speed: 0.15, loop: true });
        await walkPlayerTo(step.walkTo.x, step.walkTo.y);
        useSceneStore.getState().setMovementControl("player");
        break;
      }
      case "walk_home": {
        await applyTone({ tone: "warm", animation: "walking", speed: 0.15, loop: true });
        await walkPlayerHome();
        useSceneStore.getState().setMovementControl("player");
        break;
      }
      case "build": {
        setTyping(true);
        setBuilding(true);
        let followUp: AiMessageResponse;
        try {
          followUp = await onBuild();
        } finally {
          setTyping(false);
          setBuilding(false);
        }

        applySceneUpdates(followUp);
        await applyTone(followUp.tone);
        appendEulaMessage(followUp);

        if (followUp.actionQueue?.length) {
          await runActionQueue({
            steps: followUp.actionQueue,
            tone: followUp.tone,
            applyTone,
            applySceneUpdates,
            onBuild,
            appendEulaMessage,
            setBuilding,
            setTyping,
          });
        }
        break;
      }
      case "player_stance": {
        const stance = VALID_STANCES.has(step.stance)
          ? (step.stance as PlayerMovementKey)
          : "happy";
        useCharacterStore.getState().setStance("player", stance);
        await CharacterAssetLoader.applyBackendTone({
          tone: tone.tone,
          animation: stance as CharacterTonePayload["animation"],
          speed: 0.12,
          loop: true,
        });
        break;
      }
      default:
        break;
    }
  }
}
