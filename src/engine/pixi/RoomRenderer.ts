import { Application, Container, Graphics, Ticker } from "pixi.js";

import {
  BASE_HEIGHT,
  BASE_WIDTH,
  ROOM_COLORS,
} from "@/engine/constants";
import type { RoomObject } from "@/types/common";
import type { CharacterData } from "@/types/character";
import type { FurnitureItem } from "@/types/furniture";
import { CameraController } from "./CameraController";
import { CharacterAnimator } from "./CharacterAnimator";
import {
  createPlaceholderForObject,
  getObjectLayer,
} from "./PlaceholderSprites";
import { drawExpandableFloor, drawWorldBackdrop, DEFAULT_SCENE_FLOOR_COLORS, type SceneFloorColors } from "./WorldFloor";
import { computeHomeBounds } from "@/engine/camera/cameraZoom";
import { useCharacterStore } from "@/stores/useCharacterStore";
import { useFurnitureStore } from "@/stores/useFurnitureStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useWorldStore } from "@/stores/useWorldStore";
import type { WorldBounds } from "@/engine/world/worldBounds";
import { INITIAL_WORLD_BOUNDS } from "@/engine/world/worldBounds";
import type { RoomBackgroundState } from "@/types/roomState";
import { parseSceneColor } from "@/types/roomState";

export class RoomRenderer {
  private app: Application | null = null;
  private camera: CameraController | null = null;
  private characterAnimator: CharacterAnimator;
  private objectSprites: Map<string, Container> = new Map();
  private ambientLight: Graphics | null = null;
  private worldBackdrop: Graphics | null = null;
  private worldFloor: Graphics | null = null;
  private worldBounds: WorldBounds = { ...INITIAL_WORLD_BOUNDS };
  private floorColors: SceneFloorColors = { ...DEFAULT_SCENE_FLOOR_COLORS };
  private container: HTMLElement | null = null;
  private tickerCallback: ((ticker: Ticker) => void) | null = null;
  private mounted = false;
  private initialized = false;
  private destroyed = false;

  constructor() {
    this.characterAnimator = new CharacterAnimator();
  }

  async init(container: HTMLElement): Promise<void> {
    if (this.mounted || this.destroyed) return;

    this.container = container;
    const app = new Application();
    this.app = app;

    await app.init({
      width: BASE_WIDTH,
      height: BASE_HEIGHT,
      backgroundColor: ROOM_COLORS.background,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    if (this.destroyed) {
      this.disposeApp(app);
      return;
    }

    app.canvas.style.width = "100%";
    app.canvas.style.height = "100%";
    app.canvas.style.display = "block";

    container.appendChild(app.canvas);

    const world = new Container();
    app.stage.addChild(world);

    this.camera = new CameraController(world);
    this.setupWorldFloor();
    this.setupTicker();

    this.initialized = true;
    this.mounted = true;
  }

  private setupAmbientLight(): void {
    if (!this.camera) return;
    if (this.ambientLight?.parent) return;

    this.ambientLight = new Graphics();
    this.ambientLight.rect(
      this.worldBounds.minX,
      this.worldBounds.minY,
      this.worldBounds.maxX - this.worldBounds.minX,
      this.worldBounds.maxY - this.worldBounds.minY
    );
    this.ambientLight.fill({ color: 0xf5e6c8, alpha: 0.08 });
    this.camera.getForegroundLayer().addChildAt(this.ambientLight, 0);
  }

  private setupWorldFloor(): void {
    if (!this.camera) return;

    this.worldBackdrop = new Graphics();
    this.worldFloor = new Graphics();
    this.camera.getBackgroundLayer().addChild(this.worldBackdrop, this.worldFloor);
    this.updateWorldFloor(this.worldBounds);
  }

  updateWorldFloor(bounds: WorldBounds): void {
    if (!this.worldBackdrop || !this.worldFloor) return;
    this.worldBounds = bounds;
    drawWorldBackdrop(this.worldBackdrop, bounds, this.floorColors.background);
    drawExpandableFloor(this.worldFloor, bounds, this.floorColors);
  }

  updateSceneBackground(background: RoomBackgroundState): void {
    const bgColor = parseSceneColor(background.color);
    const floorColor = background.floorColor
      ? parseSceneColor(background.floorColor)
      : bgColor;

    this.floorColors = {
      background: bgColor,
      floor: floorColor,
      floorAccent: ROOM_COLORS.floorAccent,
    };

    if (this.app?.renderer) {
      this.app.renderer.background.color = bgColor;
    }

    this.updateWorldFloor(this.worldBounds);
  }

  private setupTicker(): void {
    if (!this.app) return;

    this.tickerCallback = (ticker: Ticker) => {
      if (this.destroyed) return;

      const player = useCharacterStore.getState().characters.player;
      const bounds = useWorldStore.getState().bounds;
      const furniture = useFurnitureStore.getState().items;
      const roomObjects = useRoomStore.getState().room?.objects ?? [];
      const homeBounds = computeHomeBounds(furniture, roomObjects);

      if (player.visible) {
        this.camera?.updateFollow(
          player.position.x,
          player.position.y,
          bounds,
          homeBounds
        );
      }

      this.camera?.update();
      this.characterAnimator.tick(ticker.deltaTime);
    };

    this.app.ticker.add(this.tickerCallback);
  }

  private stopTicker(): void {
    if (this.app && this.tickerCallback) {
      this.app.ticker.remove(this.tickerCallback);
      this.tickerCallback = null;
    }
  }

  renderObjects(objects: RoomObject[]): void {
    if (!this.camera || !this.mounted) return;

    this.clearObjectSprites();

    const sorted = [...objects].sort(
      (a, b) => getObjectLayer(a) - getObjectLayer(b)
    );

    for (const object of sorted) {
      if (!object.visibility) continue;

      const isCharacter = object.type === "character";
      if (isCharacter) continue;

      const sprite = createPlaceholderForObject(object);
      const wrapper = new Container();
      wrapper.addChild(sprite);

      if (object.type === "floor" || object.type === "wall") {
        wrapper.x = 0;
        wrapper.y = 0;
      } else {
        wrapper.x = object.position.x;
        wrapper.y = object.position.y;
      }

      wrapper.scale.set(object.scale.x, object.scale.y);
      wrapper.rotation = object.rotation;

      const layer = getObjectLayer(object);
      const targetLayer =
        layer <= 0
          ? this.camera.getBackgroundLayer()
          : layer <= 2
            ? this.camera.getMidgroundLayer()
            : this.camera.getForegroundLayer();

      targetLayer.addChild(wrapper);
      this.objectSprites.set(object.id, wrapper);
    }
  }

  renderCharacters(characters: CharacterData[]): void {
    if (!this.camera || !this.mounted) return;

    for (const character of characters) {
      const existing = this.characterAnimator.getSprite(character.id);

      if (!character.visible) {
        if (existing) existing.container.visible = false;
        continue;
      }

      if (existing) existing.container.visible = true;

      let sprite = existing;
      if (!sprite) {
        sprite = this.characterAnimator.createCharacterSprite(character);
        this.camera.getForegroundLayer().addChild(sprite.container);
      } else if (character.id === "player") {
        this.characterAnimator.updatePlayer(character);
      } else {
        const color = character.id === "eula" ? 0xe8a87c : 0x7eb8da;
        this.characterAnimator.updateAnimation(
          character.id,
          character.currentAnimation,
          color
        );
        this.characterAnimator.updatePosition(
          character.id,
          character.position.x,
          character.position.y
        );
      }
    }
  }

  renderFurniture(items: FurnitureItem[]): void {
    if (!this.camera || !this.mounted) return;

    for (const item of items) {
      if (!item.visibility) continue;
      if (this.objectSprites.has(item.id)) continue;

      const sprite = createPlaceholderForObject(item);
      const wrapper = new Container();
      wrapper.addChild(sprite);
      wrapper.x = item.position.x;
      wrapper.y = item.position.y;
      wrapper.scale.set(item.scale.x, item.scale.y);
      wrapper.rotation = item.rotation;

      this.camera.getMidgroundLayer().addChild(wrapper);
      this.objectSprites.set(item.id, wrapper);
    }
  }

  handleMouseMove(x: number, y: number): void {
    this.camera?.handleMouseMove(x, y);
  }

  setLighting(warmth: number, brightness: number): void {
    if (!this.ambientLight) return;
    this.ambientLight.clear();
    this.ambientLight.rect(
      this.worldBounds.minX,
      this.worldBounds.minY,
      this.worldBounds.maxX - this.worldBounds.minX,
      this.worldBounds.maxY - this.worldBounds.minY
    );
    const warmColor = warmth > 0.5 ? 0xf5e6c8 : 0xc8d8f5;
    this.ambientLight.fill({
      color: warmColor,
      alpha: 0.05 + brightness * 0.1,
    });
  }

  private clearObjectSprites(): void {
    for (const sprite of this.objectSprites.values()) {
      sprite.parent?.removeChild(sprite);
      sprite.destroy({ children: true });
    }
    this.objectSprites.clear();

    // Preserve foreground layer — characters and ambient light live there
    if (this.camera && !this.ambientLight?.parent) {
      this.setupAmbientLight();
    }
  }

  resize(): void {
    // Canvas scales via CSS; internal resolution stays at 1920x1080
  }

  destroy(): void {
    this.destroyed = true;
    this.stopTicker();
    this.characterAnimator.destroy();
    this.camera?.destroy();
    this.camera = null;
    if (this.app) {
      this.disposeApp(this.app);
    }
    this.container = null;
    this.mounted = false;
    this.initialized = false;
    this.objectSprites.clear();
  }

  private disposeApp(app: Application): void {
    try {
      app.canvas?.remove();
    } catch {
      // Canvas may not exist if init was interrupted
    }

    if (app.renderer) {
      try {
        app.destroy(true, { children: true });
      } catch {
        try {
          app.stage?.destroy({ children: true });
          app.renderer?.destroy(true);
        } catch {
          // Best-effort cleanup
        }
      }
    } else {
      try {
        app.stage?.destroy({ children: true });
      } catch {
        // Stage exists even before init completes
      }
    }

    if (this.app === app) {
      this.app = null;
    }
  }

  private safeDestroyApp(): void {
    if (this.app) {
      this.disposeApp(this.app);
    }
  }

  getApplication(): Application | null {
    return this.app;
  }
}
