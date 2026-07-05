import { Graphics } from "pixi.js";

import {
  BASE_HEIGHT,
  BASE_WIDTH,
  CHARACTER_COLORS,
  FURNITURE_COLORS,
  ROOM_COLORS,
} from "@/engine/constants";
import type { RoomObject } from "@/types/common";

export function drawFloor(graphics: Graphics): void {
  graphics.clear();
  graphics.rect(0, 700, BASE_WIDTH, BASE_HEIGHT - 700);
  graphics.fill(ROOM_COLORS.floor);

  for (let i = 0; i < 12; i++) {
    const x = i * 160;
    graphics.moveTo(x, 700);
    graphics.lineTo(x - 80, BASE_HEIGHT);
    graphics.stroke({ width: 1, color: ROOM_COLORS.floorAccent, alpha: 0.3 });
  }
}

export function drawWall(graphics: Graphics): void {
  graphics.clear();
  graphics.rect(0, 0, BASE_WIDTH, 720);
  graphics.fill(ROOM_COLORS.wall);

  graphics.rect(0, 680, BASE_WIDTH, 40);
  graphics.fill(ROOM_COLORS.wallLight);
}

export function drawWindow(graphics: Graphics): void {
  graphics.clear();

  const cx = BASE_WIDTH / 2;
  const cy = 280;
  const w = 320;
  const h = 220;

  graphics.rect(cx - w / 2 - 12, cy - h / 2 - 12, w + 24, h + 24);
  graphics.fill(ROOM_COLORS.windowFrame);

  graphics.rect(cx - w / 2, cy - h / 2, w, h);
  graphics.fill(ROOM_COLORS.window);

  graphics.circle(cx - 60, cy - 40, 40);
  graphics.fill({ color: ROOM_COLORS.windowGlow, alpha: 0.4 });

  graphics.rect(cx - 2, cy - h / 2, 4, h);
  graphics.fill({ color: ROOM_COLORS.windowFrame, alpha: 0.6 });
  graphics.rect(cx - w / 2, cy - 2, w, 4);
  graphics.fill({ color: ROOM_COLORS.windowFrame, alpha: 0.6 });
}

export function drawDesk(graphics: Graphics): void {
  graphics.clear();
  const cx = BASE_WIDTH / 2;
  const cy = 620;

  graphics.roundRect(cx - 140, cy - 8, 280, 16, 4);
  graphics.fill(FURNITURE_COLORS.desk);

  graphics.rect(cx - 120, cy + 8, 12, 60);
  graphics.fill(FURNITURE_COLORS.desk);
  graphics.rect(cx + 108, cy + 8, 12, 60);
  graphics.fill(FURNITURE_COLORS.desk);
}

export function drawChair(graphics: Graphics): void {
  graphics.clear();
  const cx = BASE_WIDTH / 2;
  const cy = 720;

  graphics.roundRect(cx - 50, cy - 40, 100, 80, 8);
  graphics.fill(FURNITURE_COLORS.chair);

  graphics.roundRect(cx - 40, cy - 50, 80, 20, 6);
  graphics.fill(FURNITURE_COLORS.chair);
}

export function drawPlant(graphics: Graphics): void {
  graphics.clear();
  const cx = 320;
  const cy = 650;

  graphics.roundRect(cx - 25, cy - 10, 50, 40, 4);
  graphics.fill(FURNITURE_COLORS.pot);

  graphics.ellipse(cx, cy - 30, 35, 45);
  graphics.fill(FURNITURE_COLORS.plant);
  graphics.ellipse(cx - 20, cy - 20, 20, 25);
  graphics.fill({ color: FURNITURE_COLORS.plant, alpha: 0.8 });
  graphics.ellipse(cx + 20, cy - 25, 18, 22);
  graphics.fill({ color: FURNITURE_COLORS.plant, alpha: 0.7 });
}

export function drawCharacter(
  graphics: Graphics,
  color: number,
  animation?: string
): void {
  graphics.clear();

  const bounce =
    animation === "happy" || animation === "wave" || animation === "laugh"
      ? -4
      : animation === "sad"
        ? 2
        : 0;

  graphics.roundRect(-30, -20 + bounce, 60, 70, 12);
  graphics.fill(color);

  graphics.circle(0, -45 + bounce, 28);
  graphics.fill(color);

  if (animation === "happy" || animation === "laugh") {
    graphics.arc(-10, -42 + bounce, 6, 0, Math.PI);
    graphics.stroke({ width: 2, color: 0x333333 });
    graphics.arc(10, -42 + bounce, 6, 0, Math.PI);
    graphics.stroke({ width: 2, color: 0x333333 });
  } else if (animation === "sad") {
    graphics.arc(-10, -36 + bounce, 6, Math.PI, Math.PI * 2);
    graphics.stroke({ width: 2, color: 0x333333 });
    graphics.arc(10, -36 + bounce, 6, Math.PI, Math.PI * 2);
    graphics.stroke({ width: 2, color: 0x333333 });
  } else if (animation === "surprised") {
    graphics.circle(-10, -42 + bounce, 4);
    graphics.fill(0x333333);
    graphics.circle(10, -42 + bounce, 4);
    graphics.fill(0x333333);
    graphics.circle(0, -28 + bounce, 6);
    graphics.fill(0x333333);
  } else if (animation === "thinking") {
    graphics.circle(-10, -42 + bounce, 3);
    graphics.fill(0x333333);
    graphics.circle(10, -42 + bounce, 3);
    graphics.fill(0x333333);
    graphics.circle(25, -60 + bounce, 8);
    graphics.fill({ color: 0xffffff, alpha: 0.5 });
  } else {
    graphics.circle(-10, -42 + bounce, 3);
    graphics.fill(0x333333);
    graphics.circle(10, -42 + bounce, 3);
    graphics.fill(0x333333);
  }

  if (animation === "wave") {
    graphics.roundRect(35, -30 + bounce, 15, 40, 6);
    graphics.fill(color);
  }
}

export function drawFurniturePlaceholder(
  graphics: Graphics,
  category: string
): void {
  graphics.clear();
  const colorMap: Record<string, number> = {
    desk: FURNITURE_COLORS.desk,
    chair: FURNITURE_COLORS.chair,
    plant: FURNITURE_COLORS.plant,
    book: 0x8b4513,
    technology: 0x4a5568,
    travel: 0xc4a882,
    music: 0x9b59b6,
    sports: 0xe74c3c,
    art: 0xf39c12,
    decoration: 0xa0826d,
    other: 0x888888,
  };
  const color = colorMap[category] ?? 0x888888;

  graphics.roundRect(-40, -30, 80, 60, 8);
  graphics.fill(color);
  graphics.circle(0, 0, 12);
  graphics.fill({ color: 0xffffff, alpha: 0.2 });
}

export function createPlaceholderForObject(object: RoomObject): Graphics {
  const graphics = new Graphics();

  switch (object.type) {
    case "floor":
      drawFloor(graphics);
      break;
    case "wall":
      drawWall(graphics);
      break;
    case "window":
      drawWindow(graphics);
      break;
    case "furniture": {
      const category = (object.metadata?.category as string) ?? "other";
      if (category === "desk") drawDesk(graphics);
      else if (category === "chair") drawChair(graphics);
      else drawFurniturePlaceholder(graphics, category);
      break;
    }
    case "decoration": {
      const category = (object.metadata?.category as string) ?? "plant";
      if (category === "plant") drawPlant(graphics);
      else drawFurniturePlaceholder(graphics, category);
      break;
    }
    case "character": {
      const characterId = object.metadata?.characterId as string;
      const color =
        characterId === "eula"
          ? CHARACTER_COLORS.eula
          : CHARACTER_COLORS.player;
      drawCharacter(graphics, color, object.animation);
      break;
    }
    default:
      drawFurniturePlaceholder(graphics, "other");
  }

  return graphics;
}

export function getObjectLayer(object: RoomObject): number {
  return (object.metadata?.layer as number) ?? 1;
}
