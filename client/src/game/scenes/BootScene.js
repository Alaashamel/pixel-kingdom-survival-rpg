import Phaser from "phaser";
import { SCENES, COLORS } from "../constants.js";
import AssetGenerator from "../assets/AssetGenerator.js";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  create() {
    const { width, height } = this.cameras.main;

    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

    const title = this.add.text(width / 2, height / 2 - 40, "Pixel Kingdom", {
      fontSize: "32px",
      fill: "#ffffff",
      fontFamily: "monospace",
    });
    title.setOrigin(0.5);

    const loadingText = this.add.text(width / 2, height / 2 + 20, "Generating assets...", {
      fontSize: "16px",
      fill: "#aaaaaa",
      fontFamily: "monospace",
    });
    loadingText.setOrigin(0.5);

    try {
      const generator = new AssetGenerator(this);
      generator.generateAll();
    } catch {
      loadingText.setText("Asset generation error, continuing...");
    }

    this.time.delayedCall(500, () => {
      this.scene.start(SCENES.PRELOAD);
    });
  }
}
