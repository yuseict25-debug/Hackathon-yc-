import { Container } from "pixi.js";

import { BASE_HEIGHT, BASE_WIDTH } from "@/engine/constants";

export interface CameraState {
  offsetX: number;
  offsetY: number;
  zoom: number;
  targetOffsetX: number;
  targetOffsetY: number;
  parallaxStrength: number;
}

export class CameraController {
  private worldContainer: Container;
  private backgroundLayer: Container;
  private midgroundLayer: Container;
  private foregroundLayer: Container;
  private state: CameraState;
  private mouseX = BASE_WIDTH / 2;
  private mouseY = BASE_HEIGHT / 2;

  constructor(worldContainer: Container) {
    this.worldContainer = worldContainer;
    this.state = {
      offsetX: 0,
      offsetY: 0,
      zoom: 1,
      targetOffsetX: 0,
      targetOffsetY: 0,
      parallaxStrength: 0.02,
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

  setTargetOffset(x: number, y: number): void {
    this.state.targetOffsetX = x;
    this.state.targetOffsetY = y;
  }

  handleMouseMove(screenX: number, screenY: number): void {
    this.mouseX = screenX;
    this.mouseY = screenY;
  }

  update(): void {
    const centerX = BASE_WIDTH / 2;
    const centerY = BASE_HEIGHT / 2;
    const dx = (this.mouseX - centerX) * this.state.parallaxStrength;
    const dy = (this.mouseY - centerY) * this.state.parallaxStrength;

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
  }

  getState(): CameraState {
    return { ...this.state };
  }

  destroy(): void {
    this.backgroundLayer.destroy({ children: true });
    this.midgroundLayer.destroy({ children: true });
    this.foregroundLayer.destroy({ children: true });
  }
}
