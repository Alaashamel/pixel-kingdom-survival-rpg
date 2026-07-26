import Phaser from "phaser";
import { SCENES, COLORS } from "../constants.js";

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  create() {
    const { width, height } = this.cameras.main;

    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

    const title = this.add.text(width / 2, height / 2 - 60, "Pixel Kingdom", {
      fontSize: "32px",
      fill: "#ffffff",
      fontFamily: "monospace",
    });
    title.setOrigin(0.5);

    const loadingText = this.add.text(width / 2, height / 2 + 10, "Loading...", {
      fontSize: "16px",
      fill: "#aaaaaa",
      fontFamily: "monospace",
    });
    loadingText.setOrigin(0.5);

    this.time.delayedCall(800, () => {
      this.scene.start(SCENES.MENU);
    });
  }
}
