import { PLAYER_ORIGIN } from "@/engine/camera/cameraZoom";
import { PLAYER_SPEED } from "@/engine/constants";
import type { Direction } from "@/types/character";
import { useCharacterStore } from "@/stores/useCharacterStore";
import { useSceneStore } from "@/stores/useSceneStore";

const ARRIVAL_THRESHOLD = PLAYER_SPEED * 1.5;

function directionForDelta(dx: number, dy: number): Direction {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }
  return dy > 0 ? "down" : "up";
}

/** Animate the player avatar to a canvas position. Returns a promise. */
export function walkPlayerTo(
  targetX: number,
  targetY: number
): Promise<void> {
  return new Promise((resolve) => {
    const scene = useSceneStore.getState();
    scene.setMovementControl("backend");

    const {
      setPosition,
      setDirection,
      setMoving,
      setAnimation,
    } = useCharacterStore.getState();

    setAnimation("player", "walking");

    let raf = 0;

    const finish = () => {
      cancelAnimationFrame(raf);
      setMoving("player", false);
      setAnimation("player", "idle");
      useSceneStore.getState().setMovementControl("player");
      resolve();
    };

    const step = () => {
      const player = useCharacterStore.getState().characters.player;
      const { x, y } = player.position;
      const dx = targetX - x;
      const dy = targetY - y;
      const dist = Math.hypot(dx, dy);

      if (dist <= ARRIVAL_THRESHOLD) {
        setPosition("player", targetX, targetY);
        finish();
        return;
      }

      const nx = x + (dx / dist) * PLAYER_SPEED;
      const ny = y + (dy / dist) * PLAYER_SPEED;

      setPosition("player", nx, ny);
      setDirection("player", directionForDelta(dx, dy));
      setMoving("player", true);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
  });
}

/** Walk back to the player's spawn after finishing a room task */
export function walkPlayerHome(): Promise<void> {
  return walkPlayerTo(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
}
