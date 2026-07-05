import { Container } from "pixi.js";

import { BASE_HEIGHT, BASE_WIDTH } from "@/engine/constants";
import { computeCameraZoom } from "@/engine/camera/cameraZoom";
import type { WorldBounds } from "@/engine/world/worldBounds";

export interface CameraState {
  offsetX: number;
  offsetY: number;
  zoom: number;
  targetOffsetX: number;
  targetOffsetY: number;
  parallaxStrength: number;
  centerX: number;
  centerY: number;
}

export class CameraController {
  private worldContainer: Container;
  private backgroundLayer: Container;
  private midgroundLayer: Container;
  private foregroundLayer: Container;
  private state: CameraState;
  private mouseX = BASE_WIDTH / 2;
  private mouseY = BASE_HEIGHT / 2;
  private destroyed = false;
  private followEnabled = false;

  constructor(worldContainer: Container) {
    this.worldContainer = worldContainer;
    this.state = {
      offsetX: 0,
      offsetY: 0,
      zoom: 1,
      targetOffsetX: 0,
      targetOffsetY: 0,
      parallaxStrength: 0.015,
      centerX: BASE_WIDTH / 2,
      centerY: BASE_HEIGHT / 2,
    };

    this.backgroundLayer = new Container();
    this.midgroundLayer = new Container();
    this.foregroundLayer = new Container();

    this.worldContainer.addChild(
      this.backgroundLayer,
      this.midgroundLayer,
      this.foregroundLayer
    );
  }

  getBackgroundLayer(): Container {
    return this.backgroundLayer;
  }

  getMidgroundLayer(): Container {
    return this.midgroundLayer;
  }

  getForegroundLayer(): Container {
    return this.foregroundLayer;
  }

  setParallaxStrength(strength: number): void {
    this.state.parallaxStrength = strength;
  }

  handleMouseMove(screenX: number, screenY: number): void {
    this.mouseX = screenX;
    this.mouseY = screenY;
  }

  updateFollow(
    playerX: number,
    playerY: number,
    worldBounds: WorldBounds,
    homeBounds: WorldBounds
  ): void {
    if (this.destroyed) return;
    this.followEnabled = true;

    const targetZoom = computeCameraZoom({
      playerX,
      playerY,
      worldBounds,
      homeBounds,
    });

    this.state.zoom += (targetZoom - this.state.zoom) * 0.06;

    const visibleW = BASE_WIDTH / this.state.zoom;
    const visibleH = BASE_HEIGHT / this.state.zoom;

    let targetCenterX = playerX;
    let targetCenterY = playerY;

    const minCenterX = worldBounds.minX + visibleW / 2;
    const maxCenterX = worldBounds.maxX - visibleW / 2;
    const minCenterY = worldBounds.minY + visibleH / 2;
    const maxCenterY = worldBounds.maxY - visibleH / 2;

    if (minCenterX <= maxCenterX) {
      targetCenterX = Math.max(minCenterX, Math.min(maxCenterX, targetCenterX));
    } else {
      targetCenterX = (worldBounds.minX + worldBounds.maxX) / 2;
    }

    if (minCenterY <= maxCenterY) {
      targetCenterY = Math.max(minCenterY, Math.min(maxCenterY, targetCenterY));
    } else {
      targetCenterY = (worldBounds.minY + worldBounds.maxY) / 2;
    }

    this.state.centerX += (targetCenterX - this.state.centerX) * 0.1;
    this.state.centerY += (targetCenterY - this.state.centerY) * 0.1;

    this.applyWorldTransform();
  }

  update(): void {
    if (this.destroyed) return;
    if (
      this.backgroundLayer.destroyed ||
      this.midgroundLayer.destroyed ||
      this.foregroundLayer.destroyed
    ) {
      return;
    }

    const centerX = BASE_WIDTH / 2;
    const centerY = BASE_HEIGHT / 2;
    const parallaxScale = this.followEnabled ? Math.max(0.35, this.state.zoom) : 1;
    const dx =
      (this.mouseX - centerX) * this.state.parallaxStrength * parallaxScale;
    const dy =
      (this.mouseY - centerY) * this.state.parallaxStrength * parallaxScale;

    this.state.targetOffsetX = dx;
    this.state.targetOffsetY = dy;

    this.state.offsetX +=
      (this.state.targetOffsetX - this.state.offsetX) * 0.04;
    this.state.offsetY +=
      (this.state.targetOffsetY - this.state.offsetY) * 0.04;

    this.backgroundLayer.x = this.state.offsetX * 0.3;
    this.backgroundLayer.y = this.state.offsetY * 0.3;
    this.midgroundLayer.x = this.state.offsetX * 0.6;
    this.midgroundLayer.y = this.state.offsetY * 0.6;
    this.foregroundLayer.x = this.state.offsetX;
    this.foregroundLayer.y = this.state.offsetY;

    if (this.followEnabled) {
      this.applyWorldTransform();
    }
  }

  private applyWorldTransform(): void {
    const z = this.state.zoom;
    this.worldContainer.scale.set(z);
    this.worldContainer.position.set(
      BASE_WIDTH / 2 - this.state.centerX * z,
      BASE_HEIGHT / 2 - this.state.centerY * z
    );
  }

  getState(): CameraState {
    return { ...this.state };
  }

  destroy(): void {
    this.destroyed = true;
    if (!this.backgroundLayer.destroyed) {
      this.backgroundLayer.destroy({ children: true });
    }
    if (!this.midgroundLayer.destroyed) {
      this.midgroundLayer.destroy({ children: true });
    }
    if (!this.foregroundLayer.destroyed) {
      this.foregroundLayer.destroy({ children: true });
    }
  }
}
