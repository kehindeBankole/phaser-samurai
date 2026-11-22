import { Scene } from "phaser";

/** Generates small procedural textures used by the loading screen and the level. */
export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  create() {
    const g = this.add.graphics();

    // Ground tile (64x64): grass top, dark earth below.
    g.fillStyle(0x1b1f2b).fillRect(0, 0, 64, 64);
    g.fillStyle(0x232838);
    for (let i = 0; i < 10; i++) g.fillRect((i * 23) % 60, 16 + ((i * 17) % 44), 4, 3);
    g.fillStyle(0x2f5a2c).fillRect(0, 0, 64, 10);
    g.fillStyle(0x4a8a3a).fillRect(0, 0, 64, 4);
    g.generateTexture("ground", 64, 64).clear();

    // Floating wooden platform (64x20).
    g.fillStyle(0x3b2a1e).fillRect(0, 0, 64, 20);
    g.fillStyle(0x5c4030).fillRect(0, 0, 64, 6);
    g.fillStyle(0x2a1d14).fillRect(0, 18, 64, 2).fillRect(31, 6, 2, 12);
    g.generateTexture("platform", 64, 20).clear();

    // Heart (16x14).
    g.fillStyle(0xd83a4a);
    g.fillCircle(4, 4, 4).fillCircle(12, 4, 4).fillTriangle(0, 5, 16, 5, 8, 14);
    g.generateTexture("heart", 16, 14).clear();
    g.fillStyle(0x3a3f52);
    g.fillCircle(4, 4, 4).fillCircle(12, 4, 4).fillTriangle(0, 5, 16, 5, 8, 14);
    g.generateTexture("heart-empty", 16, 14).clear();

    // Spark particle.
    g.fillStyle(0xffffff).fillRect(0, 0, 4, 4);
    g.generateTexture("spark", 4, 4).clear();

    // Torii gate (goal), 140x160.
    g.fillStyle(0xb8322a);
    g.fillRect(0, 10, 140, 14); // kasagi (top beam)
    g.fillRect(14, 44, 112, 10); // nuki
    g.fillRect(24, 10, 14, 150); // pillars
    g.fillRect(102, 10, 14, 150);
    g.fillStyle(0x1a1a1a).fillRect(0, 0, 140, 10);
    g.fillStyle(0xd9b44a).fillRect(62, 24, 16, 20);
    g.generateTexture("torii", 140, 160).destroy();

    this.scene.start("Preloader");
  }
}
