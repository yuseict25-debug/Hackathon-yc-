"use client";

import { useEffect, useRef } from "react";

import { PLAYER_SPEED } from "@/engine/constants";
import { clampToBounds } from "@/engine/world/worldBounds";
import type { Direction } from "@/types/character";
import { useCharacterStore } from "@/stores/useCharacterStore";
import { useConversationStore } from "@/stores/useConversationStore";
import { useSceneStore } from "@/stores/useSceneStore";
import { useWorldStore } from "@/stores/useWorldStore";

const KEY_MAP: Record<string, Direction> = {
  w: "up",
  W: "up",
  ArrowUp: "up",
  s: "down",
  S: "down",
  ArrowDown: "down",
  a: "left",
  A: "left",
  ArrowLeft: "left",
  d: "right",
  D: "right",
  ArrowRight: "right",
};

function movementBlocked(): boolean {
  if (useConversationStore.getState().isUserTyping) return true;
  if (useSceneStore.getState().movementControl === "backend") return true;
  return false;
}

/** Cardinal-only: W > S > A > D priority — no diagonals */
function getActiveDirection(keys: Set<string>): Direction | null {
  if (movementBlocked()) return null;

  if (keys.has("w") || keys.has("W") || keys.has("ArrowUp")) return "up";
  if (keys.has("s") || keys.has("S") || keys.has("ArrowDown")) return "down";
  if (keys.has("a") || keys.has("A") || keys.has("ArrowLeft")) return "left";
  if (keys.has("d") || keys.has("D") || keys.has("ArrowRight")) return "right";
  return null;
}

export function usePlayerMovement() {
  const setPosition = useCharacterStore((s) => s.setPosition);
  const setDirection = useCharacterStore((s) => s.setDirection);
  const setMoving = useCharacterStore((s) => s.setMoving);
  const expandForPosition = useWorldStore((s) => s.expandForPosition);
  const isUserTyping = useConversationStore((s) => s.isUserTyping);

  const keysRef = useRef(new Set<string>());

  useEffect(() => {
    const keys = keysRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.key in KEY_MAP)) return;
      if (movementBlocked()) return;
      e.preventDefault();
      keys.add(e.key);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key);
    };

    const onBlur = () => keys.clear();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    let raf = 0;
    const loop = () => {
      if (movementBlocked()) {
        keys.clear();
        const player = useCharacterStore.getState().characters.player;
        if (player.isMoving) {
          setMoving("player", false);
        }
      }

      const direction = getActiveDirection(keys);
      const player = useCharacterStore.getState().characters.player;

      if (direction) {
        let { x, y } = player.position;
        switch (direction) {
          case "up":
            y -= PLAYER_SPEED;
            break;
          case "down":
            y += PLAYER_SPEED;
            break;
          case "left":
            x -= PLAYER_SPEED;
            break;
          case "right":
            x += PLAYER_SPEED;
            break;
        }

        const fixedRoom = Boolean(
          useSceneStore.getState().roomState?.background?.width
        );
        if (!fixedRoom) {
          expandForPosition(x, y);
        }

        const nextBounds = useWorldStore.getState().bounds;
        ({ x, y } = clampToBounds(x, y, nextBounds));

        setPosition("player", x, y);
        setDirection("player", direction);
        setMoving("player", true);
      } else if (player.isMoving) {
        setMoving("player", false);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      keys.clear();
    };
  }, [expandForPosition, isUserTyping, setDirection, setMoving, setPosition]);
}
