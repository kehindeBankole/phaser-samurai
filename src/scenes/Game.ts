import Phaser from "phaser";
import { Player } from "../objects/Player";
import { Enemy } from "../objects/Enemy";

const WORLD_W = 6200;
const GROUND_Y = 476; // top surface of the ground

// Solid ground spans [startX, endX]; the gaps between them are pits.
const GROUND: [number, number][] = [
  [0, 1408], [1600, 2624], [2816, 3904], [4096, 4800], [4992, WORLD_W],
];

// Floating platforms: x, y, width in tiles.
const PLATFORMS: [number, number, number][] = [
  [520, 380, 3], [820, 300, 2],
  [1380, 390, 4], // bridge-ish over the first pit
  [1950, 370, 3], [2250, 290, 3],
  [2660, 380, 3],
  [3200, 380, 2], [3420, 300, 3], [3700, 220, 2],
  [3880, 390, 4],
  [4400, 370, 3], [4760, 360, 4],
  [5300, 380, 3], [5550, 300, 2],
];

const ENEMIES: [number, number][] = [
  [900, 120], [1200, 100],
  [2000, 150], [2400, 150],
  [3000, 120], [3480, 60], [3700, 100],
  [4300, 120], [4600, 100],
  [5150, 120], [5400, 140], [5700, 100],
];

const STARS: [number, number][] = [
  [568, 340], [600, 340], [868, 260], [900, 260],
  [1440, 350], [1504, 350], [2010, 330], [2310, 250], [2340, 250],
  [2720, 340], [3240, 340], [3480, 260], [3730, 180], [3760, 180],
  [3940, 350], [4460, 330], [4830, 320], [5360, 340], [5590, 260],
];

const GOAL_X = 6000;

export class Game extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private stars!: Phaser.Physics.Arcade.StaticGroup;
  private bg!: Phaser.GameObjects.TileSprite;
  private hearts: Phaser.GameObjects.Image[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private score = 0;
  private finished = false;
  private checkpointX = 120;

  constructor() {
    super("Game");
  }

  create() {
    this.score = 0;
    this.finished = false;
    this.checkpointX = 120;
    this.hearts = [];

    const { width, height } = this.scale;
    this.physics.world.setBounds(0, 0, WORLD_W, height + 200);
    this.physics.world.checkCollision.down = false; // let things fall into pits

    // Parallax forest background.
    const bgTex = this.textures.get("background").getSourceImage();
    const bgScale = height / bgTex.height;
    this.bg = this.add.tileSprite(0, 0, width, height, "background")
      .setOrigin(0).setScrollFactor(0).setTileScale(bgScale, bgScale);

    // Level geometry.
    const solids = this.physics.add.staticGroup();
    for (const [x0, x1] of GROUND) {
      const w = x1 - x0;
      const t = this.add.tileSprite(x0, GROUND_Y, w, 64 + 40, "ground").setOrigin(0);
      solids.add(t);
    }
    for (const [x, y, tiles] of PLATFORMS) {
      const t = this.add.tileSprite(x, y, tiles * 64, 20, "platform").setOrigin(0);
      solids.add(t);
      const b = t.body as Phaser.Physics.Arcade.StaticBody;
      // One-way platforms: only collide from above.
      b.checkCollision.down = false;
      b.checkCollision.left = false;
      b.checkCollision.right = false;
    }

    // Goal shrine.
    const torii = this.add.image(GOAL_X, GROUND_Y, "torii").setOrigin(0.5, 1).setDepth(2);
    this.add.text(GOAL_X, GROUND_Y - 190, "SHRINE", { fontFamily: "monospace", fontSize: "14px", color: "#ffd166" })
      .setOrigin(0.5);
    this.tweens.add({ targets: torii, scaleY: 1.02, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // Collectibles.
    this.stars = this.physics.add.staticGroup();
    for (const [x, y] of STARS) {
      const s = this.stars.create(x, y, "star") as Phaser.Physics.Arcade.Sprite;
      s.setScale(0.4).refreshBody();
      this.tweens.add({ targets: s, y: y - 6, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: Math.random() * 800 });
    }

    // Characters.
    this.player = new Player(this, this.checkpointX, GROUND_Y - 80);
    this.enemies = this.add.group({ runChildUpdate: false });
    for (const [x, range] of ENEMIES) this.enemies.add(new Enemy(this, x, GROUND_Y - 200, range));

    this.physics.add.collider(this.player, solids);
    this.physics.add.collider(this.enemies, solids);
    this.physics.add.overlap(this.player, this.stars, (_p, star) => this.collectStar(star as Phaser.Physics.Arcade.Sprite));

    // Effects.
    this.sparks = this.add.particles(0, 0, "spark", {
      speed: { min: 80, max: 260 }, angle: { min: 0, max: 360 }, lifespan: 350,
      scale: { start: 1.2, end: 0 }, tint: [0xffffff, 0xffd166, 0xff6b6b], emitting: false,
    }).setDepth(20);

    this.events.on("player-swing", this.onPlayerSwing, this);

    // Camera.
    this.cameras.main.setBounds(0, 0, WORLD_W, height).startFollow(this.player, true, 0.12, 0.12, 0, 60);
    this.cameras.main.setDeadzone(80, 60);
    this.cameras.main.fadeIn(300);

    this.createHud();
  }

  update(time: number) {
    this.bg.tilePositionX = this.cameras.main.scrollX * 0.35 / this.bg.tileScaleX;

    this.player.update(time);
    for (const e of this.enemies.getChildren() as Enemy[]) {
      if (this.finished && e.alive) e.setVelocityX(0).play("idle", true);
      else e.update(time, this.player);
    }

    // Advance checkpoint at the start of each solid ground section the player reaches.
    for (const [x0] of GROUND) {
      if (this.player.cx > x0 + 60 && x0 + 60 > this.checkpointX && this.player.body.blocked.down) this.checkpointX = x0 + 60;
    }

    // Fell into a pit.
    if (!this.player.dead && this.player.y > this.scale.height + 120) this.fallIntoPit();

    if (!this.finished && !this.player.dead && this.player.cx > GOAL_X - 20 && this.player.body.blocked.down) this.win();
    if (!this.finished && this.player.dead) this.lose();

    this.updateHud();
  }

  private onPlayerSwing(player: Player) {
    // Check hits on the frame the blade comes around.
    this.time.delayedCall(70, () => {
      if (player.dead) return;
      const zone = player.swordZone();
      this.drawSlash(zone, player.facing);
      let hit = false;
      for (const e of this.enemies.getChildren() as Enemy[]) {
        if (!e.alive) continue;
        if (Phaser.Geom.Intersects.RectangleToRectangle(zone, e.bodyRect()) && e.takeHit(player.cx, player.swingId)) {
          hit = true;
          this.sparks.explode(12, e.cx, e.body.center.y);
          if (!e.alive) this.addScore(100);
        }
      }
      if (hit) {
        this.cameras.main.shake(80, 0.006);
        // Brief hit-stop sells the impact.
        this.physics.world.pause();
        this.time.delayedCall(45, () => this.physics.world.resume());
      }
    });
  }

  private drawSlash(zone: Phaser.Geom.Rectangle, facing: number) {
    const g = this.add.graphics().setDepth(15);
    const cx = facing === 1 ? zone.x : zone.right;
    const cy = zone.centerY;
    g.lineStyle(4, 0xffffff, 0.9);
    g.beginPath();
    g.arc(cx, cy, zone.width, facing === 1 ? -1.1 : Math.PI - 1.1, facing === 1 ? 1.1 : Math.PI + 1.1, false);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 140, onComplete: () => g.destroy() });
  }

  private collectStar(star: Phaser.Physics.Arcade.Sprite) {
    star.disableBody(true, true);
    this.addScore(10);
    this.sparks.explode(6, star.x, star.y);
    // Every 10 stars restores a heart.
    const collected = STARS.length - this.stars.countActive();
    if (collected % 10 === 0) this.player.heal();
  }

  private fallIntoPit() {
    this.player.hurt(this.player.cx, 1);
    if (this.player.hp <= 0) return;
    this.player.setPosition(this.checkpointX, GROUND_Y - 80).setVelocity(0, 0);
    this.cameras.main.flash(200, 0, 0, 0);
  }

  private addScore(n: number) {
    this.score += n;
  }

  private createHud() {
    for (let i = 0; i < this.player.maxHp; i++) {
      this.hearts.push(this.add.image(20 + i * 22, 20, "heart").setOrigin(0).setScrollFactor(0).setDepth(100).setScale(1.2));
    }
    this.scoreText = this.add.text(this.scale.width - 20, 16, "", {
      fontFamily: "monospace", fontSize: "20px", color: "#e8e3d3", stroke: "#000", strokeThickness: 4,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
  }

  private updateHud() {
    this.hearts.forEach((h, i) => h.setTexture(i < this.player.hp ? "heart" : "heart-empty"));
    const left = (this.enemies.getChildren() as Enemy[]).filter((e) => e.alive).length;
    this.scoreText.setText(`SCORE ${this.score}   RONIN ${left}`);
  }

  private win() {
    this.finished = true;
    const left = (this.enemies.getChildren() as Enemy[]).filter((e) => e.alive).length;
    const bonus = left === 0 ? 1000 : 0;
    this.score += bonus + this.player.hp * 100;
    this.player.body.setVelocityX(0);
    this.player.body.moves = false;
    this.player.play("idle");
    this.showEndScreen("SHRINE REACHED", bonus ? "Every ronin defeated  +1000" : `${left} ronin still roam`);
  }

  private lose() {
    this.finished = true;
    this.time.delayedCall(700, () => this.showEndScreen("YOU HAVE FALLEN", "The forest claims another"));
  }

  private showEndScreen(title: string, subtitle: string) {
    const { width, height } = this.scale;
    const layer = this.add.container(0, 0).setScrollFactor(0).setDepth(200).setAlpha(0);
    layer.add(this.add.rectangle(0, 0, width, height, 0x000000, 0.65).setOrigin(0));
    layer.add(this.add.text(width / 2, height / 2 - 60, title, {
      fontFamily: "monospace", fontSize: "48px", color: "#e8e3d3", stroke: "#000", strokeThickness: 6,
    }).setOrigin(0.5));
    layer.add(this.add.text(width / 2, height / 2, subtitle, { fontFamily: "monospace", fontSize: "18px", color: "#c9c2ad" }).setOrigin(0.5));
    layer.add(this.add.text(width / 2, height / 2 + 40, `SCORE ${this.score}`, { fontFamily: "monospace", fontSize: "24px", color: "#ffd166" }).setOrigin(0.5));
    layer.add(this.add.text(width / 2, height / 2 + 90, "ENTER: play again    ESC: menu", { fontFamily: "monospace", fontSize: "16px", color: "#c9c2ad" }).setOrigin(0.5));
    this.tweens.add({ targets: layer, alpha: 1, duration: 300 });

    const kb = this.input.keyboard!;
    kb.once("keydown-ENTER", () => this.scene.restart());
    kb.once("keydown-ESC", () => this.scene.start("Menu"));
  }
}
