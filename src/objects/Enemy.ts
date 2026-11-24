import Phaser from "phaser";
import { Knight } from "./Knight";
import { flash } from "./flash";
import type { Player } from "./Player";
import { sfx } from "../fx/sfx";

const TINT = 0xff8a7a;
const PATROL_SPEED = 60;
const CHASE_SPEED = 120;
const SIGHT_RANGE = 280;
const ATTACK_RANGE = 52;
const WINDUP_MS = 380;
const ATTACK_COOLDOWN_MS = 1100;

type State = "patrol" | "chase" | "windup" | "strike" | "hurt" | "dead";

/** A ronin: patrols its home ground, chases the player on sight, and telegraphs its slashes. */
export class Enemy extends Knight {
  hp = 3;
  state: State = "patrol";
  lastHitBySwing = -1;

  private homeX: number;
  private range: number;
  private stateUntil = 0;
  private lastAttack = -Infinity;
  private struck = false;

  constructor(scene: Phaser.Scene, x: number, y: number, range = 140) {
    super(scene, x, y);
    this.homeX = this.cx;
    this.range = range;
    this.setTint(TINT).setDepth(5);
    this.play({ key: "walk", startFrame: Phaser.Math.Between(0, 7) });
    this.setFacing(Math.random() < 0.5 ? 1 : -1);
  }

  get alive() {
    return this.state !== "dead";
  }

  update(time: number, player: Player) {
    if (this.state === "dead") return;
    const onGround = this.body.blocked.down;
    const dx = player.cx - this.cx;
    const dist = Math.abs(dx);
    const sameLevel = Math.abs(player.body.bottom - this.body.bottom) < 70;
    const sees = !player.dead && sameLevel && dist < SIGHT_RANGE;

    switch (this.state) {
      case "hurt":
        if (time > this.stateUntil) this.state = "chase";
        return;

      case "windup":
        this.setVelocityX(0);
        if (time > this.stateUntil) {
          this.state = "strike";
          this.struck = false;
          this.stateUntil = time + 260;
          this.play("attack", true);
          this.setVelocityX(this.facing * 160); // lunge
          sfx.enemyStrike(this.loudness(player));
        }
        return;

      case "strike":
        if (!this.struck && this.anims.currentFrame && this.anims.currentFrame.index >= 2) {
          this.struck = true;
          const zone = this.swordZone(40);
          if (Phaser.Geom.Intersects.RectangleToRectangle(zone, player.bodyRect())) {
            player.hurt(this.cx);
          }
        }
        if (time > this.stateUntil) {
          this.state = "chase";
          this.setVelocityX(0);
        }
        return;
    }

    // Patrol / chase.
    if (sees) {
      this.state = "chase";
      this.setFacing(dx > 0 ? 1 : -1);
      if (dist < ATTACK_RANGE && time - this.lastAttack > ATTACK_COOLDOWN_MS && onGround) {
        this.lastAttack = time;
        this.state = "windup";
        this.stateUntil = time + WINDUP_MS;
        this.setVelocityX(0);
        this.play("idle", true);
        flash(this, TINT, 0xffffff, 120);
        sfx.enemyWindup(this.loudness(player));
        this.scene.time.delayedCall(200, () => this.alive && this.state === "windup" && flash(this, TINT, 0xffffff, 120));
        return;
      }
      this.setVelocityX(dist < ATTACK_RANGE - 10 ? 0 : this.facing * CHASE_SPEED);
    } else {
      this.state = "patrol";
      if (this.cx > this.homeX + this.range) this.setFacing(-1);
      else if (this.cx < this.homeX - this.range) this.setFacing(1);
      // Turn around at walls and ledges instead of walking off.
      if (this.body.blocked.left) this.setFacing(1);
      if (this.body.blocked.right) this.setFacing(-1);
      this.setVelocityX(this.facing * PATROL_SPEED);
    }

    if (onGround && this.atLedge()) {
      this.setVelocityX(0);
      if (this.state === "patrol") this.setFacing(this.facing === 1 ? -1 : 1);
    }

    this.play(Math.abs(this.body.velocity.x) > 1 ? "walk" : "idle", true);
  }

  /** Quieter the further the ronin is from the player, silent once off screen. */
  private loudness(player: Player) {
    return Phaser.Math.Clamp(1 - Math.abs(player.cx - this.cx) / 500, 0, 1);
  }

  /** True when there is no ground just ahead of the enemy's feet. */
  private atLedge() {
    const probeX = this.facing === 1 ? this.body.right + 6 : this.body.left - 6;
    const bodies = this.scene.physics.overlapRect(probeX, this.body.bottom + 2, 2, 6, false, true);
    return bodies.length === 0;
  }

  takeHit(fromX: number, swingId: number) {
    if (!this.alive || swingId === this.lastHitBySwing) return false;
    this.lastHitBySwing = swingId;
    this.hp--;
    flash(this, TINT, 0xffffff, 100);
    const away = this.cx < fromX ? -1 : 1;
    if (this.hp <= 0) {
      this.die(away);
    } else {
      this.state = "hurt";
      this.stateUntil = this.scene.time.now + 300;
      this.setVelocity(away * 220, -200);
    }
    return true;
  }

  private die(away: number) {
    this.state = "dead";
    this.body.checkCollision.none = true;
    this.setVelocity(away * 180, -380);
    this.play("fall");
    this.scene.tweens.add({
      targets: this, angle: away * 180, alpha: 0, duration: 700, ease: "Quad.easeIn",
      onComplete: () => this.destroy(),
    });
  }
}
