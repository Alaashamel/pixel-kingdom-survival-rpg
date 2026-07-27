import { COLORS } from "../constants.js";

export default class LevelUpNotification {
  constructor(scene) {
    this.scene = scene;
    this.notifications = [];
  }

  show(level) {
    const { width, height } = this.scene.cameras.main;

    const container = this.scene.add.container(width / 2, height * 0.3);
    container.setScrollFactor(0);
    container.setDepth(300);
    container.setAlpha(0);

    const bg = this.scene.add.rectangle(0, 0, 300, 60, 0x000000, 0.8);
    bg.setStrokeStyle(2, COLORS.XP_BAR);

    const text = this.scene.add.text(0, -8, `LEVEL UP!`, {
      fontSize: "24px",
      fill: "#00e676",
      fontFamily: "monospace",
      fontStyle: "bold",
    });
    text.setOrigin(0.5);

    const subtext = this.scene.add.text(0, 16, `Level ${level}`, {
      fontSize: "14px",
      fill: "#ffffff",
      fontFamily: "monospace",
    });
    subtext.setOrigin(0.5);

    container.add([bg, text, subtext]);

    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      y: height * 0.25,
      duration: 500,
      ease: "Power2",
      onComplete: () => {
        this.scene.tweens.add({
          targets: container,
          alpha: 0,
          y: height * 0.2,
          duration: 500,
          delay: 1500,
          ease: "Power2",
          onComplete: () => container.destroy(),
        });
      },
    });

    this.scene.cameras.main.flash(300, 0, 230, 118, true);
  }
}
