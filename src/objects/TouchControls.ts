import Phaser from "phaser";
import type { Player } from "./Player";
import { haptics } from "../fx/haptics";

type ButtonId = "left" | "right" | "jump" | "slash" | "run";

type Button = {
  id: ButtonId;
  x: number;
  y: number;
  r: number;
  bg: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
};

const IDLE_ALPHA = 0.28;
const ACTIVE_ALPHA = 0.6;

export function isTouchDevice(game: Phaser.Game) {
  return game.device.input.touch && window.matchMedia("(pointer: coarse)").matches;
}

/**
 * On-screen buttons for phones and tablets. Holds are polled from every active pointer each
 * frame, so a thumb can slide from ◀ to ▶ without lifting. Taps on JUMP/SLASH are also caught
 * on pointer-down so a quick tap is never missed.
 */
export class TouchControls {
  private buttons: Button[] = [];
  private runOn = false;
  private enabled = true;

  constructor(private scene: Phaser.Scene, private player: Player) {
    scene.input.addPointer(3); // up to 4 simultaneous touches

    const { width, height } = scene.scale;
    const y = height - 78;
    this.add("left", 86, y, 54, "◀");
    this.add("right", 214, y, 54, "▶");
    this.add("slash", width - 214, y + 10, 50, "SLASH");
    this.add("jump", width - 86, y - 20, 60, "JUMP");
    this.add("run", width - 96, y - 132, 36, "RUN");

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      if (!this.enabled) return;
      const hit = this.hit(p.x, p.y);
      // Runs inside the tap itself, which is the only time iPhones allow a haptic tick.
      if (hit === "jump" || hit === "slash" || hit === "run") haptics.tap();
      if (hit === "jump") player.pressJump();
      if (hit === "slash") player.pressAttack();
      if (hit === "run") {
        this.runOn = !this.runOn;
        this.style(this.get("run"), this.runOn);
      }
    });
  }

  private add(id: ButtonId, x: number, y: number, r: number, text: string) {
    const bg = this.scene.add.circle(x, y, r, 0x000000, IDLE_ALPHA)
      .setStrokeStyle(3, 0xe8e3d3, 0.55).setScrollFactor(0).setDepth(150);
    const label = this.scene.add.text(x, y, text, {
      fontFamily: "monospace", fontSize: r > 45 ? "18px" : "14px", color: "#e8e3d3", fontStyle: "bold",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151).setAlpha(0.8);
    if (text.length === 1) label.setFontSize(30);
    this.buttons.push({ id, x, y, r, bg, label });
  }

  private get(id: ButtonId) {
    return this.buttons.find((b) => b.id === id)!;
  }

  private hit(x: number, y: number): ButtonId | undefined {
    // A slightly larger touch target than the drawn circle is kinder to thumbs.
    return this.buttons.find((b) => Phaser.Math.Distance.Between(x, y, b.x, b.y) < b.r * 1.25)?.id;
  }

  private style(b: Button, active: boolean) {
    b.bg.setFillStyle(active ? 0xb8322a : 0x000000, active ? ACTIVE_ALPHA : IDLE_ALPHA);
  }

  update() {
    const held = new Set<ButtonId>();
    if (this.enabled) {
      for (const p of this.scene.input.manager.pointers) {
        if (!p.isDown) continue;
        const id = this.hit(p.x, p.y);
        if (id) held.add(id);
      }
    }

    const t = this.player.touch;
    t.left = held.has("left");
    t.right = held.has("right");
    t.jump = held.has("jump");
    t.run = this.runOn;

    for (const b of this.buttons) {
      if (b.id === "run") continue;
      this.style(b, held.has(b.id));
    }
  }

  setVisible(visible: boolean) {
    this.enabled = visible;
    for (const b of this.buttons) {
      b.bg.setVisible(visible);
      b.label.setVisible(visible);
    }
    if (!visible) this.update();
  }
}
