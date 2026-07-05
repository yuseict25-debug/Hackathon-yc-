import { Container, Graphics } from "pixi.js";

import { BASE_HEIGHT, BASE_WIDTH } from "@/engine/constants";
import type { AnimationState } from "@/types/character";
import type { CharacterData } from "@/types/character";
import { drawCharacter } from "./PlaceholderSprites";

export interface CharacterSprite {
  container: Container;
  body: Graphics;
  characterId: string;
  currentAnimation: AnimationState;
  baseY: number;
}

export class CharacterAnimator {
  private sprites: Map<string, CharacterSprite> = new Map();
  private animationTime = 0;

  createCharacterSprite(character: CharacterData): CharacterSprite {
    const container = new Container();
    container.x = character.position.x;
    container.y = character.position.y;
    container.scale.set(character.scale.x, character.scale.y);
    container.rotation = character.rotation;
    container.visible = character.visible;

    const body = new Graphics();
    const color = character.id === "eula" ? 0xe8a87c : 0x7eb8da;
    drawCharacter(body, color, character.currentAnimation);
    container.addChild(body);

    const sprite: CharacterSprite = {
      container,
      body,
      characterId: character.id,
      currentAnimation: character.currentAnimation,
      baseY: character.position.y,
    };

    this.sprites.set(character.id, sprite);
    return sprite;
  }

  updateAnimation(
    characterId: string,
    animation: AnimationState,
    color: number
  ): void {
    const sprite = this.sprites.get(characterId);
    if (!sprite || sprite.currentAnimation === animation) return;

    sprite.currentAnimation = animation;
    drawCharacter(sprite.body, color, animation);
  }

  updatePosition(characterId: string, x: number, y: number): void {
    const sprite = this.sprites.get(characterId);
    if (!sprite) return;
    sprite.container.x = x;
    sprite.baseY = y;
    sprite.container.y = y;
  }

  updateScale(
    characterId: string,
    scaleX: number,
    scaleY: number
  ): void {
    const sprite = this.sprites.get(characterId);
    if (!sprite) return;
    sprite.container.scale.set(scaleX, scaleY);
  }

  tick(delta: number): void {
    this.animationTime += delta;

    for (const sprite of this.sprites.values()) {
      if (sprite.currentAnimation === "idle") {
        sprite.container.y =
          sprite.baseY +
          Math.sin(this.animationTime * 0.05 + sprite.container.x * 0.01) *
            0.15;
      } else if (sprite.currentAnimation === "thinking") {
        sprite.container.y =
          sprite.baseY + Math.sin(this.animationTime * 0.03) * 0.1;
      } else {
        sprite.container.y = sprite.baseY;
      }
    }
  }

  getSprite(characterId: string): CharacterSprite | undefined {
    return this.sprites.get(characterId);
  }

  getAllContainers(): Container[] {
    return Array.from(this.sprites.values()).map((s) => s.container);
  }

  destroy(): void {
    for (const sprite of this.sprites.values()) {
      sprite.container.destroy({ children: true });
    }
    this.sprites.clear();
  }
}

export function createSpriteSheetPlaceholder(
  _spriteId: string,
  _frameWidth: number,
  _frameHeight: number
): Graphics {
  const g = new Graphics();
  g.rect(0, 0, 64, 96);
  g.fill(0xcccccc);
  return g;
}
