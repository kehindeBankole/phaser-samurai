import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {

    this.add.image(0, 0, "boot-bg").setScale(2)

    this.add.rectangle(272, 300, 470, 32).setStrokeStyle(1, 0xffffff);


    const bar = this.add.rectangle(140, 300, 200, 28, 0xffffff);

    this.load.on("progress", (progress: number) => {

      bar.width = 4 + 460 * progress;

    });
  }

  preload() {
    this.load.setPath("assets/image");

    this.load.image("logo", "logo.png");
    this.load.image("star", "star.png");
  }

  create() {

    setTimeout(() => this.scene.start("Game"), 1000);
  }
}
