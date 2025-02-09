import Phaser from "phaser";
import { Boot } from "./scenes/Boot";
import { Preloader } from "./scenes/Preloader";
import { Game } from "./scenes/Game";

var config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: [Boot, Preloader, Game],
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
      // gravity: {
      //   // y: 300,
      //   // x:0
      // },
    },
  },
};

var game = new Phaser.Game(config);

export default game;
