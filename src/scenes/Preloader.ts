import { Scene } from "phaser";

const FRAME = { frameWidth: 128, frameHeight: 128 };

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2 - 40, "SAMURAI", {
      fontFamily: "monospace", fontSize: "32px", color: "#e8e3d3",
    }).setOrigin(0.5);

    this.add.rectangle(width / 2, height / 2 + 10, 404, 20).setStrokeStyle(2, 0xe8e3d3);
    const bar = this.add.rectangle(width / 2 - 200, height / 2 + 10, 0, 14, 0xb8322a).setOrigin(0, 0.5);
    this.load.on("progress", (p: number) => (bar.width = 400 * p));
  }

  preload() {
    this.load.setPath("assets/image");
    this.load.image("background", "Background.png");
    this.load.image("star", "star.png");
    this.load.spritesheet("knight-idle", "Idle.png", FRAME);
    this.load.spritesheet("knight-walk", "Walk.png", FRAME);
    this.load.spritesheet("knight-run", "RunSheet.png", FRAME);
    this.load.spritesheet("knight-jump", "Jump.png", FRAME);
  }

  create() {
    const a = this.anims;
    a.create({ key: "idle", frames: a.generateFrameNumbers("knight-idle", { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
    a.create({ key: "walk", frames: a.generateFrameNumbers("knight-walk", { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    a.create({ key: "run", frames: a.generateFrameNumbers("knight-run", { start: 0, end: 6 }), frameRate: 14, repeat: -1 });
    a.create({ key: "rise", frames: a.generateFrameNumbers("knight-jump", { frames: [1, 2] }), frameRate: 8, repeat: 0 });
    a.create({ key: "fall", frames: a.generateFrameNumbers("knight-jump", { frames: [2] }), frameRate: 1, repeat: 0 });
    a.create({ key: "attack", frames: a.generateFrameNumbers("knight-jump", { frames: [3, 4, 5] }), frameRate: 16, repeat: 0 });

    this.scene.start("Menu");
  }
}
