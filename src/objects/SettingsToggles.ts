import Phaser from "phaser";
import { sfx, soundEnabled, setSoundEnabled } from "../fx/sfx";
import { haptics, hapticsSupported, vibrationEnabled, setVibrationEnabled } from "../fx/haptics";

const STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "monospace", fontSize: "14px", color: "#e8e3d3", backgroundColor: "#00000066",
  padding: { x: 10, y: 6 },
};

/**
 * SOUND and VIBRATE switches, right-aligned at (x, y). The M key also toggles sound.
 * Vibrate is only shown on devices that can vibrate.
 */
export function addSettingsToggles(scene: Phaser.Scene, x: number, y: number) {
  const make = (row: number, label: string, get: () => boolean, set: (on: boolean) => void) => {
    const t = scene.add.text(x, y + row * 34, "", STYLE)
      .setOrigin(1, 0).setScrollFactor(0).setDepth(160).setInteractive({ useHandCursor: true });
    const refresh = () => t.setText(`${label} ${get() ? "ON " : "OFF"}`).setAlpha(get() ? 1 : 0.6);
    const toggle = () => {
      set(!get());
      refresh();
      sfx.click();
      haptics.tap();
    };
    t.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
      toggle();
    });
    refresh();
    return { text: t, toggle };
  };

  const sound = make(0, "SOUND  ", soundEnabled, setSoundEnabled);
  const toggles = [sound.text];
  if (hapticsSupported) toggles.push(make(1, "VIBRATE", vibrationEnabled, setVibrationEnabled).text);

  const onM = () => sound.toggle();
  scene.input.keyboard?.on("keydown-M", onM);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.input.keyboard?.off("keydown-M", onM));
  return toggles;
}
