import Phaser from "phaser";
import AudioSystem from "../systems/AudioSystem";
import { SCENES, COLORS } from "../constants.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  create() {
    const { width, height } = this.cameras.main;

    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

    if (!this.game.audioSystem) {
      this.game.audioSystem = new AudioSystem(this);
      this.game.audioSystem.init();
    }

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
      this.game.audioSystem.playUIClick();
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start(SCENES.GAME);
      });
    });

    this.createButton(width / 2, height / 2 + 80, "Settings", () => {
      this.game.audioSystem.playUIClick();
      this.openSettings();
    });

    const versionText = this.add.text(width - 10, height - 10, "v0.2.0", {
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

  openSettings() {
    if (this.settingsContainer) return;

    const { width, height } = this.cameras.main;

    this.settingsContainer = this.add.container(0, 0);
    this.settingsContainer.setDepth(100);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.settingsContainer.add(overlay);

    const panelW = 300;
    const panelH = 250;
    const px = width / 2;
    const py = height / 2;

    const panelBg = this.add.rectangle(px, py, panelW, panelH, COLORS.UI_BG, 0.95);
    panelBg.setStrokeStyle(2, COLORS.UI_ACCENT);
    this.settingsContainer.add(panelBg);

    const title = this.add.text(px, py - panelH / 2 + 20, "Settings", {
      fontSize: "20px", fill: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
    });
    title.setOrigin(0.5);
    this.settingsContainer.add(title);

    const audio = this.game.audioSystem;
    const isMuted = audio.isMuted;

    const muteLabel = this.add.text(px - 100, py - 40, `Mute: ${isMuted ? "ON" : "OFF"}`, {
      fontSize: "14px", fill: "#ffffff", fontFamily: "monospace",
    });
    this.settingsContainer.add(muteLabel);

    const muteBtn = this.add.rectangle(px + 80, py - 36, 60, 28, isMuted ? 0x00cc00 : 0xcc0000);
    muteBtn.setStrokeStyle(1, 0xffffff);
    muteBtn.setInteractive({ useHandCursor: true });
    this.settingsContainer.add(muteBtn);

    const muteBtnText = this.add.text(px + 80, py - 36, isMuted ? "ON" : "OFF", {
      fontSize: "12px", fill: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
    });
    muteBtnText.setOrigin(0.5);
    this.settingsContainer.add(muteBtnText);

    muteBtn.on("pointerdown", () => {
      audio.toggleMute();
      const now = audio.isMuted;
      muteLabel.setText(`Mute: ${now ? "ON" : "OFF"}`);
      muteBtn.setFillStyle(now ? 0x00cc00 : 0xcc0000);
      muteBtnText.setText(now ? "ON" : "OFF");
    });

    const musicLabel = this.add.text(px - 100, py + 10, "Music:", {
      fontSize: "14px", fill: "#ffffff", fontFamily: "monospace",
    });
    this.settingsContainer.add(musicLabel);

    const musicBar = this.add.rectangle(px + 20, py + 14, 120, 12, 0x333333);
    musicBar.setOrigin(0, 0.5);
    this.settingsContainer.add(musicBar);

    const musicFill = this.add.rectangle(px + 20, py + 14, 120 * audio.musicVolume, 12, 0x4488ff);
    musicFill.setOrigin(0, 0.5);
    this.settingsContainer.add(musicFill);

    musicBar.setInteractive({ useHandCursor: true });
    musicBar.on("pointerdown", (pointer) => {
      const relX = Phaser.Math.Clamp(pointer.x - (px + 20), 0, 120);
      audio.setMusicVolume(relX / 120);
      musicFill.width = 120 * audio.musicVolume;
    });

    const sfxLabel = this.add.text(px - 100, py + 50, "SFX:", {
      fontSize: "14px", fill: "#ffffff", fontFamily: "monospace",
    });
    this.settingsContainer.add(sfxLabel);

    const sfxBar = this.add.rectangle(px + 20, py + 54, 120, 12, 0x333333);
    sfxBar.setOrigin(0, 0.5);
    this.settingsContainer.add(sfxBar);

    const sfxFill = this.add.rectangle(px + 20, py + 54, 120 * audio.sfxVolume, 12, 0x44cc44);
    sfxFill.setOrigin(0, 0.5);
    this.settingsContainer.add(sfxFill);

    sfxBar.setInteractive({ useHandCursor: true });
    sfxBar.on("pointerdown", (pointer) => {
      const relX = Phaser.Math.Clamp(pointer.x - (px + 20), 0, 120);
      audio.setSFXVolume(relX / 120);
      sfxFill.width = 120 * audio.sfxVolume;
    });

    const closeBtn = this.add.text(px + panelW / 2 - 15, py - panelH / 2 + 12, "X", {
      fontSize: "16px", fill: "#ff6666", fontFamily: "monospace", fontStyle: "bold",
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => {
      audio.playUIClick();
      this.settingsContainer.destroy();
      this.settingsContainer = null;
    });
    this.settingsContainer.add(closeBtn);

    overlay.setInteractive();
    overlay.on("pointerdown", () => {
      this.settingsContainer.destroy();
      this.settingsContainer = null;
    });
  }
}
