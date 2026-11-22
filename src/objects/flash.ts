import Phaser from "phaser";

/** Briefly fills a sprite with a solid colour, then restores its base tint. */
export function flash(sprite: Phaser.GameObjects.Sprite, baseTint: number, color = 0xffffff, ms = 90) {
  sprite.setTint(color).setTintMode(Phaser.TintModes.FILL);
  sprite.scene.time.delayedCall(ms, () => {
    if (!sprite.active) return;
    sprite.setTintMode(Phaser.TintModes.MULTIPLY).setTint(baseTint);
  });
}
