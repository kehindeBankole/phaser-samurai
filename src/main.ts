import Phaser from "phaser";
import { Boot } from "./scenes/Boot";
import { Preloader } from "./scenes/Preloader";
import { Menu } from "./scenes/Menu";
import { Game } from "./scenes/Game";
import { setupRotatePrompt } from "./orientation";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  width: 960,
  height: 540,
  backgroundColor: "#0d0f17",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 1400 },
      debug: false,
    },
  },
  scene: [Boot, Preloader, Menu, Game],
};

const game = new Phaser.Game(config);
setupRotatePrompt();

// Pause the game while a phone is held upright (the "turn your phone" overlay is showing).
const portrait = window.matchMedia("(orientation: portrait) and (pointer: coarse)");
const syncOrientation = () => (portrait.matches ? game.pause() : game.resume());
portrait.addEventListener("change", syncOrientation);
game.events.once(Phaser.Core.Events.READY, syncOrientation);

// Handy for poking at the game from the browser console during development.
if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;

export default game;
