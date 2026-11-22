import Phaser from "phaser";

// The knight art sits left-of-centre inside each 128x128 frame (x≈12–54, y≈64–127).
const BODY_W = 22;
const BODY_H = 54;
const OFFSET_X = 22;
const OFFSET_Y = 72;

/** Shared base for the player and enemies: physics body sized to the art, with facing. */
export class Knight extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  facing: 1 | -1 = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "knight-idle");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(BODY_W, BODY_H).setOffset(OFFSET_X, OFFSET_Y);
  }

  setFacing(dir: 1 | -1) {
    if (dir === this.facing) return;
    this.facing = dir;
    this.setFlipX(dir === -1);
    // Flipping mirrors the art around the frame centre, so mirror the body offset too,
    // and shift the sprite so the body (and visible character) stays in place.
    const left = 128 - OFFSET_X - BODY_W;
    this.body.setOffset(dir === 1 ? OFFSET_X : left, OFFSET_Y);
    this.x += dir === 1 ? left - OFFSET_X : OFFSET_X - left;
  }

  /** Horizontal centre of the character (the sprite's x is the frame centre, not the art's). */
  get cx() {
    return this.body.center.x;
  }

  bodyRect() {
    const b = this.body;
    return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
  }

  /** Rectangle in front of the knight where a sword swing lands. */
  swordZone(reach = 46, height = 44) {
    const b = this.body;
    const x = this.facing === 1 ? b.right : b.left - reach;
    return new Phaser.Geom.Rectangle(x, b.top + 6, reach, height);
  }
}
