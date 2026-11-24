import Phaser from "phaser";
import { Knight } from "./Knight";
import { flash } from "./flash";
import { sfx } from "../fx/sfx";
import { haptics } from "../fx/haptics";

const WALK_SPEED = 170;
const RUN_SPEED = 280;
const JUMP_VELOCITY = -620;
const COYOTE_MS = 90;
const JUMP_BUFFER_MS = 110;
const ATTACK_COOLDOWN_MS = 320;
const INVULN_MS = 1000;

type Keys = {
  left: Phaser.Input.Keyboard.Key[];
  right: Phaser.Input.Keyboard.Key[];
  jump: Phaser.Input.Keyboard.Key[];
  run: Phaser.Input.Keyboard.Key[];
  attack: Phaser.Input.Keyboard.Key[];
};

export class Player extends Knight {
  maxHp = 5;
  hp = 5;
  dead = false;
  /** Set for one swing; the scene reads and clears it to apply hits. */
  swingId = 0;
  attacking = false;

  /** Held state from the on-screen touch buttons, merged with the keyboard. */
  touch = { left: false, right: false, run: false, jump: false };

  private keys: Keys;
  private lastGrounded = 0;
  private jumpPressedAt = -Infinity;
  private lastAttack = -Infinity;
  private attackQueuedAt = -Infinity;
  private invulnUntil = 0;
  private stunnedUntil = 0;
  private wasOnGround = false;
  private prevVy = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.setDepth(10);
    this.body.setMaxVelocityY(900);
    this.play("idle");

    const kb = scene.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    const k = (...codes: number[]) => codes.map((c) => kb.addKey(c));
    this.keys = {
      left: k(K.LEFT, K.A),
      right: k(K.RIGHT, K.D),
      jump: k(K.UP, K.W, K.SPACE),
      run: k(K.SHIFT),
      attack: k(K.J, K.X),
    };

    // Buffer presses from key-down events so even taps shorter than one frame register.
    for (const key of this.keys.jump) key.on("down", () => this.pressJump());
    for (const key of this.keys.attack) key.on("down", () => this.pressAttack());

    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + "attack", () => (this.attacking = false));
  }

  pressJump() {
    this.jumpPressedAt = this.scene.time.now;
  }

  pressAttack() {
    this.attackQueuedAt = this.scene.time.now;
  }

  get invulnerable() {
    return this.scene.time.now < this.invulnUntil;
  }

  update(time: number) {
    if (this.dead) return;
    const down = (keys: Phaser.Input.Keyboard.Key[]) => keys.some((key) => key.isDown);

    const onGround = this.body.blocked.down;
    if (onGround) this.lastGrounded = time;
    // Thud on landing from a real fall (not when stepping off a tiny ledge).
    if (onGround && !this.wasOnGround && this.prevVy > 350) {
      sfx.land();
      haptics.land();
    }
    this.wasOnGround = onGround;
    this.prevVy = this.body.velocity.y;

    const stunned = time < this.stunnedUntil;

    // Horizontal movement.
    const t = this.touch;
    const dir = (down(this.keys.right) || t.right ? 1 : 0) - (down(this.keys.left) || t.left ? 1 : 0);
    const running = down(this.keys.run) || t.run;
    if (!stunned) {
      const speed = running ? RUN_SPEED : WALK_SPEED;
      // Slow down while swinging on the ground so attacks feel weighty.
      const factor = this.attacking && onGround ? 0.25 : 1;
      this.setVelocityX(dir * speed * factor);
      if (dir !== 0 && !this.attacking) this.setFacing(dir as 1 | -1);
    }

    // Jump with coyote time + input buffer.
    const canJump = time - this.lastGrounded < COYOTE_MS;
    if (!stunned && canJump && time - this.jumpPressedAt < JUMP_BUFFER_MS) {
      this.setVelocityY(JUMP_VELOCITY);
      this.lastGrounded = -Infinity;
      this.jumpPressedAt = -Infinity;
      sfx.jump();
    }
    // Variable jump height: releasing early cuts the jump.
    if (!down(this.keys.jump) && !t.jump && this.body.velocity.y < -200) {
      this.setVelocityY(this.body.velocity.y * 0.6);
    }

    // Attack.
    if (!stunned && time - this.attackQueuedAt < JUMP_BUFFER_MS && time - this.lastAttack > ATTACK_COOLDOWN_MS) {
      this.lastAttack = time;
      this.attackQueuedAt = -Infinity;
      this.attacking = true;
      this.swingId++;
      this.play("attack", true);
      sfx.swing();
      this.scene.events.emit("player-swing", this);
    }

    // Animation state.
    if (this.attacking) return;
    if (!onGround) {
      this.play(this.body.velocity.y < 0 ? "rise" : "fall", true);
    } else if (dir !== 0) {
      this.play(running ? "run" : "walk", true);
    } else {
      this.play("idle", true);
    }
  }

  hurt(fromX: number, damage = 1) {
    if (this.dead || this.invulnerable) return false;
    this.hp = Math.max(0, this.hp - damage);
    const now = this.scene.time.now;
    this.invulnUntil = now + INVULN_MS;
    this.stunnedUntil = now + 250;
    this.attacking = false;
    const away = this.cx < fromX ? -1 : 1;
    this.setVelocity(away * 260, -320);
    flash(this, 0xffffff, 0xff4444, 120);
    sfx.hurt();
    haptics.hurt();
    this.scene.tweens.add({ targets: this, alpha: 0.35, duration: 90, yoyo: true, repeat: 4, onComplete: () => this.setAlpha(1) });
    if (this.hp === 0) this.die();
    return true;
  }

  heal(amount = 1) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    sfx.heal();
    haptics.heal();
  }

  die() {
    this.dead = true;
    this.body.setVelocityX(0);
    this.play("fall");
    this.scene.tweens.add({ targets: this, angle: this.facing * -90, alpha: 0.6, duration: 400 });
  }
}
