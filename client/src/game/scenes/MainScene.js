import Phaser from "phaser";
import Player from "../entities/Player";
import World from "../world/World";

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  create() {
    this.worldSystem = new World(this);
    this.worldSystem.create();

    this.player = new Player(this, 2500, 2500);

    this.cameras.main.setBounds(0, 0, 5000, 5000);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.roundPixels = true;

    this.cursors = this.input.keyboard.createCursorKeys();

    this.add.text(20, 20, "Pixel Kingdom", {
      fontSize: "28px",
      fill: "#ffffff",
      fontFamily: "monospace",
    }).setScrollFactor(0);
  }

  update() {
    this.player.move(this.cursors);
  }
}

export default MainScene;
