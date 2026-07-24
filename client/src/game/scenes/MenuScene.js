import Phaser from "phaser";
import { SCENES, COLORS } from "../constants.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  create() {
    const { width, height } = this.cameras.main;

    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.5);
      this.add.circle(x, y, size, 0xffffff, alpha);
    }

    const title = this.add.text(width / 2, height / 3, "Pixel Kingdom", {
      fontSize: "48px",
      fill: "#ffffff",
      fontFamily: "monospace",
      fontStyle: "bold",
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height / 3 + 50, "Survival RPG", {
      fontSize: "24px",
      fill: "#e94560",
      fontFamily: "monospace",
    });
    subtitle.setOrigin(0.5);

    this.createButton(width / 2, height / 2 + 20, "Start Game", () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start(SCENES.GAME);
      });
    });

    this.createButton(width / 2, height / 2 + 80, "Settings", () => {
      // Placeholder for settings
    });

    const versionText = this.add.text(width - 10, height - 10, "v0.1.0", {
      fontSize: "12px",
      fill: "#666666",
      fontFamily: "monospace",
    });
    versionText.setOrigin(1, 1);

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  createButton(x, y, label, callback) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 220, 50, COLORS.UI_BG);
    bg.setStrokeStyle(2, COLORS.UI_ACCENT);

    const text = this.add.text(0, 0, label, {
      fontSize: "20px",
      fill: "#ffffff",
      fontFamily: "monospace",
    });
    text.setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(220, 50);
    container.setInteractive({ useHandCursor: true });

    container.on("pointerover", () => {
      bg.setFillStyle(COLORS.UI_ACCENT);
      text.setScale(1.05);
    });

    container.on("pointerout", () => {
      bg.setFillStyle(COLORS.UI_BG);
      text.setScale(1);
    });

    container.on("pointerdown", () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: callback,
      });
    });

    return container;
  }
}
