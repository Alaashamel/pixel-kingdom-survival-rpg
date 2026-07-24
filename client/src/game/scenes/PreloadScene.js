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

    const barBg = this.add.rectangle(width / 2, height / 2 + 10, 304, 24, 0x333333);
    barBg.setStrokeStyle(2, 0x666666);

    const bar = this.add.rectangle(width / 2 - 150, height / 2 + 10, 0, 16, COLORS.UI_ACCENT);
    bar.setOrigin(0, 0.5);

    const percentText = this.add.text(width / 2, height / 2 + 10, "0%", {
      fontSize: "14px",
      fill: "#ffffff",
      fontFamily: "monospace",
    });
    percentText.setOrigin(0.5);

    const assets = this.textures.getKeys();
    const totalAssets = assets.length;
    let loaded = 0;

    const loadNext = () => {
      if (loaded >= totalAssets) {
        percentText.setText("100%");
        bar.width = 300;

        this.time.delayedCall(500, () => {
          this.scene.start(SCENES.MENU);
        });
        return;
      }

      const progress = loaded / totalAssets;
      bar.width = 300 * progress;
      percentText.setText(`${Math.floor(progress * 100)}%`);
      loaded++;

      this.time.delayedCall(50, loadNext);
    };

    this.time.delayedCall(300, loadNext);
  }
}
