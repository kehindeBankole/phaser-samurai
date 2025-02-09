import Phaser from 'phaser';

export class Game extends Phaser.Scene {
  player: Phaser.Physics.Arcade.Sprite | undefined;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  bg: Phaser.GameObjects.TileSprite | undefined;
  cam: Phaser.Cameras.Scene2D.Camera | undefined;

  private canJump: boolean = true;

  constructor() {
    super("Game");
  }


  create() {
    this.physics.world.gravity.y = 300;

    this.bg = this.add
      .tileSprite(0, 0, +this.scale.width, +this.scale.height, "background")
      .setOrigin(0, 0)
      .setScrollFactor(0);

    this.player = this.physics.add.sprite(50, 600, "samurai-walk");
    this.player.setCollideWorldBounds(true);

    this.cam = this.cameras.main.setBounds(
      0,
      0,
      +this.game.config.width * 1.5,
      +this.game.config.height
    );

    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNumbers("samurai-idle", { start: 0, end: 2 }),
      frameRate: 5,
      repeat: -1,
    });

    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("samurai-walk", { start: 0, end: 6 }),
      frameRate: 5,
      repeat: -1,
    });

    this.anims.create({
      key: "jump",
      frames: this.anims.generateFrameNumbers("samurai-jump", { start: 0, end: 8 }),
      frameRate: 5,
      repeat: 0,
    });

    this.player.setSize(32, 128);
    this.player.setOffset(50, 0);

    this.cursors = this.input.keyboard?.createCursorKeys();



   this.cam.startFollow(this.player);
    this.cameras.main.setFollowOffset(0, 0)
  }

  update() {
    if (!this.player || !this.cursors || !this.bg || !this.cam) return;

    const onGround = this.player.body?.blocked.down

    if (onGround) {
      this.canJump = true;
    }

    this.player.setVelocityX(0);

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-100);
      this.player.flipX = true;
      this.bg.tilePositionX += 2;
      if (onGround) {
        this.player.anims.play("walk" , true); 
      }
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(100);
      this.player.flipX = false;
      this.bg.tilePositionX -= 2;

      if (onGround) {
        this.player.anims.play("walk", true); 
      }
    } else {
      if (onGround) {
        this.player.anims.play("idle", true); 
      }
    }

    if (this.cursors.up.isDown && this.canJump && onGround) {
      this.player.setVelocityY(-100); 
      this.player.anims.play("jump", true);
      this.canJump = false; 
    }

    if (!onGround && !this.cursors.up.isDown) {
      this.player.anims.stop(); 
    }


  //  this.bg.tilePositionX = this.cam.scrollX * 0.7;
  }
}