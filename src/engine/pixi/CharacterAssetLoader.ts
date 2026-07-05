import { Assets, Texture } from "pixi.js";

import type { AnimationState, CharacterId } from "@/types/character";
import type {
  CharacterAnimationConfig,
  CharacterAnimationsData,
  PlayerMovementKey,
} from "@/types/characterAnimations";
import type { CharacterTonePayload } from "@/types/characterTone";
import { resolveFrameUrl } from "@/types/characterAnimations";

export class CharacterAssetLoader {
  private static config: CharacterAnimationsData | null = null;
  private static textureCache = new Map<string, Texture>();
  private static loadPromise: Promise<void> | null = null;
  private static backendTone: CharacterTonePayload | null = null;

  static async load(data: CharacterAnimationsData): Promise<void> {
    if (this.config === data && this.textureCache.size > 0) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this.doLoad(data);
    return this.loadPromise;
  }

  private static async doLoad(data: CharacterAnimationsData): Promise<void> {
    this.config = data;
    const urls = this.collectUrls(data);

    await Promise.all(
      [...urls].map(async (url) => {
        if (this.textureCache.has(url)) return;
        const texture = await Assets.load<Texture>(url);
        texture.source.scaleMode = "nearest";
        this.textureCache.set(url, texture);
      })
    );
  }

  private static collectUrls(data: CharacterAnimationsData): Set<string> {
    const urls = new Set<string>();
    for (const charMap of Object.values(data.characters)) {
      if (!charMap) continue;
      for (const anim of Object.values(charMap)) {
        if (!anim) continue;
        for (const frame of anim.frames) {
          urls.add(this.normalizeFrameUrl(frame));
        }
      }
    }
    if (data.playerMovement) {
      for (const anim of Object.values(data.playerMovement)) {
        if (!anim) continue;
        for (const frame of anim.frames) {
          urls.add(this.normalizeFrameUrl(frame));
        }
      }
    }
    return urls;
  }

  /** Expand a frame entry — bare paths without a file become frame 1 */
  static normalizeFrameUrl(frame: string): string {
    if (frame.match(/\/\d+\.\w+$/) || frame.match(/\/[^/]+\.\w+$/)) {
      return frame;
    }
    return resolveFrameUrl(frame, 1);
  }

  static hasCharacter(characterId: CharacterId): boolean {
    return Boolean(this.config?.characters[characterId]);
  }

  static getAnimationConfig(
    characterId: CharacterId,
    animation: AnimationState
  ): CharacterAnimationConfig | null {
    if (
      this.backendTone &&
      this.backendTone.animation === animation &&
      this.backendTone.frames?.length
    ) {
      return {
        frames: this.backendTone.frames,
        speed: this.backendTone.speed ?? 0.1,
        loop: this.backendTone.loop ?? true,
      };
    }

    const charMap = this.config?.characters[characterId];
    if (!charMap) return null;

    return charMap[animation] ?? charMap.idle ?? null;
  }

  /** Apply tone JSON from backend — preloads any new frame URLs */
  static async applyBackendTone(
    tone: CharacterTonePayload | null
  ): Promise<void> {
    this.backendTone = tone;
    if (!tone?.frames?.length) return;

    await Promise.all(
      tone.frames.map(async (frame) => {
        const url = this.normalizeFrameUrl(frame);
        if (this.textureCache.has(url)) return;
        const texture = await Assets.load<Texture>(url);
        texture.source.scaleMode = "nearest";
        this.textureCache.set(url, texture);
      })
    );
  }

  static getTextures(
    characterId: CharacterId,
    animation: AnimationState
  ): Texture[] {
    const config = this.getAnimationConfig(characterId, animation);
    if (!config) return [];

    return config.frames
      .map((frame) => this.textureCache.get(this.normalizeFrameUrl(frame)))
      .filter((t): t is Texture => t !== undefined);
  }

  static getPlayerMovementConfig(
    key: PlayerMovementKey
  ): CharacterAnimationConfig | null {
    return this.config?.playerMovement?.[key] ?? null;
  }

  static getPlayerMovementTextures(key: PlayerMovementKey): Texture[] {
    const config = this.getPlayerMovementConfig(key);
    if (!config) return [];

    return config.frames
      .map((frame) => this.textureCache.get(this.normalizeFrameUrl(frame)))
      .filter((t): t is Texture => t !== undefined);
  }

  static hasPlayerMovement(): boolean {
    return Boolean(this.config?.playerMovement);
  }

  static isReady(): boolean {
    return this.config !== null && this.textureCache.size > 0;
  }

  static reset(): void {
    this.config = null;
    this.textureCache.clear();
    this.loadPromise = null;
    this.backendTone = null;
  }
}
