import { AnimatedSprite, Container, Graphics } from "pixi.js";

import { EULA_SPRITE_SCALE, PLAYER_SPRITE_SCALE } from "@/engine/constants";
import {
  resolvePlayerMovementKey,
} from "@/engine/player/playerMovement";
import type { AnimationState, CharacterData, Direction, PlayerConversationMode } from "@/types/character";
import type { CharacterAnimationConfig, PlayerMovementKey } from "@/types/characterAnimations";
import { CharacterAssetLoader } from "./CharacterAssetLoader";
import { drawCharacter } from "./PlaceholderSprites";

export interface CharacterSprite {
  container: Container;
  display: Graphics | AnimatedSprite;
  characterId: string;
  currentAnimation: AnimationState;
  baseY: number;
  usesUrlSprites: boolean;
  isPlayer: boolean;
  playerMovementKey?: PlayerMovementKey;
  playerDirection?: Direction;
  playerMoving?: boolean;
  playerStance?: PlayerMovementKey | null;
  playerConversationMode?: PlayerConversationMode;
}

export class CharacterAnimator {
  private sprites: Map<string, CharacterSprite> = new Map();
  private animationTime = 0;
  private destroyed = false;

  createCharacterSprite(character: CharacterData): CharacterSprite {
    const container = new Container();
    container.x = character.position.x;
    container.y = character.position.y;
    container.scale.set(character.scale.x, character.scale.y);
    container.rotation = character.rotation;
    container.visible = character.visible;

    const isPlayer = character.id === "player";
    const usesUrlSprites =
      character.sprite === "url" &&
      (isPlayer
        ? CharacterAssetLoader.hasPlayerMovement()
        : CharacterAssetLoader.hasCharacter(character.id));

    let display: Graphics | AnimatedSprite;

    if (usesUrlSprites && isPlayer) {
      display = this.createPlayerSprite(character);
    } else if (usesUrlSprites) {
      display = this.createEulaSprite(character);
    } else {
      const body = new Graphics();
      const color = character.id === "eula" ? 0xe8a87c : 0x7eb8da;
      drawCharacter(body, color, character.currentAnimation);
      display = body;
    }

    container.addChild(display);

    const movementKey = isPlayer
      ? resolvePlayerMovementKey(
          character.direction,
          character.isMoving,
          character.stance,
          character.conversationMode ?? "none"
        )
      : undefined;

    const sprite: CharacterSprite = {
      container,
      display,
      characterId: character.id,
      currentAnimation: character.currentAnimation,
      baseY: character.position.y,
      usesUrlSprites,
      isPlayer,
      playerMovementKey: movementKey,
      playerDirection: character.direction,
      playerMoving: character.isMoving,
      playerStance: character.stance ?? null,
      playerConversationMode: character.conversationMode ?? "none",
    };

    this.sprites.set(character.id, sprite);
    return sprite;
  }

  updatePlayer(character: CharacterData): void {
    const sprite = this.sprites.get(character.id);
    if (!sprite || !sprite.isPlayer || sprite.container.destroyed) return;

    const stanceOverride = character.stance ?? null;
    const conversationMode = character.conversationMode ?? "none";
    const movementKey = resolvePlayerMovementKey(
      character.direction,
      character.isMoving,
      stanceOverride,
      conversationMode
    );

    sprite.baseY = character.position.y;
    sprite.container.x = character.position.x;
    sprite.container.y = character.position.y;

    const movementChanged =
      sprite.playerMovementKey !== movementKey ||
      sprite.playerDirection !== character.direction ||
      sprite.playerMoving !== character.isMoving ||
      sprite.playerStance !== stanceOverride ||
      sprite.playerConversationMode !== conversationMode;

    if (!movementChanged && sprite.display instanceof AnimatedSprite) {
      return;
    }

    sprite.playerMovementKey = movementKey;
    sprite.playerDirection = character.direction;
    sprite.playerMoving = character.isMoving;
    sprite.playerStance = stanceOverride;
    sprite.playerConversationMode = conversationMode;

    if (!(sprite.display instanceof AnimatedSprite)) return;

    const textures = CharacterAssetLoader.getPlayerMovementTextures(movementKey);
    const config = CharacterAssetLoader.getPlayerMovementConfig(movementKey);
    if (textures.length === 0) return;

    sprite.display.textures = textures;
    this.applyPlayerScale(sprite.display, config);
    this.applyUrlAnimation(sprite.display, config);
  }

  updateAnimation(
    characterId: string,
    animation: AnimationState,
    color: number
  ): void {
    const sprite = this.sprites.get(characterId);
    if (!sprite || sprite.container.destroyed || sprite.isPlayer) return;
    if (sprite.currentAnimation === animation) return;

    sprite.currentAnimation = animation;

    if (sprite.usesUrlSprites && sprite.display instanceof AnimatedSprite) {
      const textures = CharacterAssetLoader.getTextures(
        characterId as CharacterData["id"],
        animation
      );
      const config = CharacterAssetLoader.getAnimationConfig(
        characterId as CharacterData["id"],
        animation
      );
      if (textures.length === 0) return;

      sprite.display.textures = textures;
      sprite.display.scale.set(EULA_SPRITE_SCALE);
      this.applyUrlAnimation(sprite.display, config);
    } else if (sprite.display instanceof Graphics) {
      drawCharacter(sprite.display, color, animation);
    }
  }

  updatePosition(characterId: string, x: number, y: number): void {
    const sprite = this.sprites.get(characterId);
    if (!sprite || sprite.container.destroyed) return;
    sprite.container.x = x;
    sprite.baseY = y;
    sprite.container.y = y;
  }

  updateScale(characterId: string, scaleX: number, scaleY: number): void {
    const sprite = this.sprites.get(characterId);
    if (!sprite || sprite.container.destroyed) return;
    sprite.container.scale.set(scaleX, scaleY);
  }

  tick(delta: number): void {
    if (this.destroyed) return;

    this.animationTime += delta;

    for (const sprite of this.sprites.values()) {
      if (sprite.container.destroyed || !sprite.container.parent) continue;
      if (sprite.usesUrlSprites || sprite.isPlayer) continue;

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

  private createEulaSprite(character: CharacterData): AnimatedSprite {
    const textures = CharacterAssetLoader.getTextures(
      character.id,
      character.currentAnimation
    );
    const config = CharacterAssetLoader.getAnimationConfig(
      character.id,
      character.currentAnimation
    );

    const animated = new AnimatedSprite({
      textures: textures.length > 0 ? textures : [],
      autoPlay: false,
      animationSpeed: config?.speed ?? 0.1,
      loop: config?.loop ?? true,
    });
    animated.anchor.set(0.5, 1);
    animated.scale.set(EULA_SPRITE_SCALE);
    this.applyUrlAnimation(animated, config);
    return animated;
  }

  private createPlayerSprite(character: CharacterData): AnimatedSprite {
    const movementKey = resolvePlayerMovementKey(
      character.direction,
      character.isMoving,
      character.stance,
      character.conversationMode ?? "none"
    );
    const textures =
      CharacterAssetLoader.getPlayerMovementTextures(movementKey);
    const config = CharacterAssetLoader.getPlayerMovementConfig(movementKey);

    const animated = new AnimatedSprite({
      textures: textures.length > 0 ? textures : [],
      autoPlay: false,
      animationSpeed: config?.speed ?? 0.15,
      loop: config?.loop ?? true,
    });
    animated.anchor.set(0.5, 1);
    this.applyPlayerScale(animated, config);
    this.applyUrlAnimation(animated, config);
    return animated;
  }

  private applyPlayerScale(
    animated: AnimatedSprite,
    config: CharacterAnimationConfig | null
  ): void {
    const sizeScale = config?.scale ?? 1;
    const s = PLAYER_SPRITE_SCALE * sizeScale;
    animated.scale.set(s, s);
  }

  private applyUrlAnimation(
    animated: AnimatedSprite,
    config: CharacterAnimationConfig | null
  ): void {
    const loop = config?.loop ?? true;
    const speed = config?.speed ?? 0.1;

    animated.loop = loop;
    animated.animationSpeed = speed;

    if (!loop || speed === 0) {
      animated.gotoAndStop(0);
      return;
    }

    animated.play();
  }

  destroy(): void {
    this.destroyed = true;
    for (const sprite of this.sprites.values()) {
      if (!sprite.container.destroyed) {
        sprite.container.destroy({ children: true });
      }
    }
    this.sprites.clear();
  }
}
