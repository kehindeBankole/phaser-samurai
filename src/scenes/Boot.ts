import { Scene } from "phaser";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.image("boot-bg", "assets/image/bg-1.png");
    this.load.image("background", "assets/image/Background.png");
    this.load.spritesheet("samurai-walk", "assets/image/Walk.png", {
      frameWidth: 128,
      frameHeight: 128,
      margin: 0,
      spacing: 0,
    });
    this.load.spritesheet("samurai-jump", "assets/image/Jump.png", {
      frameWidth: 128,
      frameHeight: 128,
      margin: 0,
      spacing: 0,
    });

    this.load.spritesheet("samurai-idle", "assets/image/Idle.png", {
      frameWidth: 128,
      frameHeight: 128,
      margin: 0,
      spacing: 0,
    });
  }

  create() {
    this.add.text(10, 10, "loading...");
    setTimeout(() => this.scene.start("Preloader"), 0);
  }
}
