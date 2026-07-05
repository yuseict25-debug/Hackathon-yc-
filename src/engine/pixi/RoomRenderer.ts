import { Application, Container, Graphics } from "pixi.js";

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

export class RoomRenderer {
  private app: Application | null = null;
  private camera: CameraController | null = null;
  private characterAnimator: CharacterAnimator;
  private objectSprites: Map<string, Container> = new Map();
  private ambientLight: Graphics | null = null;
  private mounted = false;

  constructor() {
    this.characterAnimator = new CharacterAnimator();
  }

  async init(container: HTMLElement): Promise<void> {
    if (this.mounted) return;

    this.app = new Application();
    await this.app.init({
      width: BASE_WIDTH,
      height: BASE_HEIGHT,
      backgroundColor: ROOM_COLORS.background,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.app.canvas.style.width = "100%";
    this.app.canvas.style.height = "100%";
    this.app.canvas.style.display = "block";

    container.appendChild(this.app.canvas);

    const world = new Container();
    this.app.stage.addChild(world);

    this.camera = new CameraController(world);
    this.setupAmbientLight();
    this.setupTicker();

    this.mounted = true;
  }

  private setupAmbientLight(): void {
    if (!this.camera) return;

    this.ambientLight = new Graphics();
    this.ambientLight.rect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    this.ambientLight.fill({ color: 0xf5e6c8, alpha: 0.08 });
    this.camera.getForegroundLayer().addChild(this.ambientLight);
  }

  private setupTicker(): void {
    if (!this.app) return;

    this.app.ticker.add((ticker) => {
      this.camera?.update();
      this.characterAnimator.tick(ticker.deltaTime);
    });
  }

  renderObjects(objects: RoomObject[]): void {
    if (!this.camera) return;

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
    if (!this.camera) return;

    for (const character of characters) {
      if (!character.visible) continue;

      let sprite = this.characterAnimator.getSprite(character.id);
      if (!sprite) {
        sprite = this.characterAnimator.createCharacterSprite(character);
        this.camera.getForegroundLayer().addChild(sprite.container);
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
    if (!this.camera) return;

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
    this.ambientLight.rect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    const warmColor = warmth > 0.5 ? 0xf5e6c8 : 0xc8d8f5;
    this.ambientLight.fill({
      color: warmColor,
      alpha: 0.05 + brightness * 0.1,
    });
  }

  private clearObjectSprites(): void {
    for (const sprite of this.objectSprites.values()) {
      sprite.destroy({ children: true });
    }
    this.objectSprites.clear();

    if (this.camera) {
      this.camera.getBackgroundLayer().removeChildren();
      this.camera.getMidgroundLayer().removeChildren();
      this.camera.getForegroundLayer().removeChildren();
      this.setupAmbientLight();
    }
  }

  resize(): void {
    // Canvas scales via CSS; internal resolution stays at 1920x1080
  }

  destroy(): void {
    this.characterAnimator.destroy();
    this.camera?.destroy();
    this.app?.destroy(true, { children: true });
    this.app = null;
    this.camera = null;
    this.mounted = false;
    this.objectSprites.clear();
  }

  getApplication(): Application | null {
    return this.app;
  }
}
