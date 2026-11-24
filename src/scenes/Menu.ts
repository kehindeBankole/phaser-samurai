import Phaser, { Scene } from "phaser";
import { isTouchDevice } from "../objects/TouchControls";
import { enterLandscape } from "../orientation";
import { addSettingsToggles } from "../objects/SettingsToggles";
import { sfx } from "../fx/sfx";

export class Menu extends Scene {
  constructor() {
    super("Menu");
  }

  create() {
    const { width, height } = this.scale;
    const bg = this.add.image(width / 2, height / 2, "background");
    bg.setScale(Math.max(width / bg.width, height / bg.height)).setTint(0x8890a8);

    this.add.text(width / 2, 120, "SAMURAI", {
      fontFamily: "monospace", fontSize: "72px", color: "#e8e3d3", stroke: "#000", strokeThickness: 8,
    }).setOrigin(0.5);
    this.add.text(width / 2, 180, "Reach the shrine. Cut down the ronin.", {
      fontFamily: "monospace", fontSize: "18px", color: "#c9c2ad",
    }).setOrigin(0.5);

    this.add.sprite(width / 2 + 10, 260, "knight-idle").setScale(2).play("idle");

    const touch = isTouchDevice(this.game);
    const controls = touch ? "◀ ▶ move   RUN toggle\nJUMP   SLASH" : [
      "← → / A D   move",
      "SHIFT       run",
      "↑ / W / SPACE  jump",
      "J / X       slash",
    ].join("\n");
    this.add.text(width / 2, 435, controls, {
      fontFamily: "monospace", fontSize: "16px", color: "#c9c2ad", align: touch ? "center" : "left",
    }).setOrigin(0.5, 0);

    const prompt = this.add.text(width / 2, 405, touch ? "Tap to begin" : "Press ENTER to begin", {
      fontFamily: "monospace", fontSize: "20px", color: "#ffd166",
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });

    addSettingsToggles(this, width - 16, 16);

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      sfx.click();
      this.scene.start("Game");
    };
    this.input.keyboard?.once("keydown-ENTER", start);
    this.input.on("pointerup", (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0) return; // tapped a SOUND / VIBRATE switch, not "begin"
      // Phones: go fullscreen and keep the screen in landscape where the browser allows it.
      if (touch) enterLandscape();
      start();
    });
  }
}
