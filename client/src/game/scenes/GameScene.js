import Phaser from "phaser";
import Player from "../entities/Player";
import World from "../world/World";
import { SCENES, COLORS, WORLD } from "../constants.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME);
  }

  create() {
    this.worldSystem = new World(this);
    this.worldSystem.create();

    this.player = new Player(this, WORLD.WIDTH / 2, WORLD.HEIGHT / 2);

    this.cameras.main.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.roundPixels = true;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.createHUD();

    this.isPaused = false;
    this.input.keyboard.on("keydown-ESC", () => {
      this.togglePause();
    });

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  createHUD() {
    const hudContainer = this.add.container(0, 0);
    hudContainer.setScrollFactor(0);
    hudContainer.setDepth(100);

    const barX = 16;
    const barWidth = 160;
    const barHeight = 14;
    const barGap = 22;

    const createBar = (y, color, label) => {
      const bg = this.add.rectangle(barX, y, barWidth, barHeight, 0x000000, 0.6);
      bg.setOrigin(0, 0);
      bg.setStrokeStyle(1, 0x333333);

      const fill = this.add.rectangle(barX + 2, y + 2, barWidth - 4, barHeight - 4, color);
      fill.setOrigin(0, 0);

      const text = this.add.text(barX + barWidth + 8, y, label, {
        fontSize: "10px",
        fill: "#ffffff",
        fontFamily: "monospace",
      });
      text.setOrigin(0, 0);

      return { bg, fill, text };
    };

    this.healthBar = createBar(16, COLORS.HEALTH_BAR, "HP");
    this.manaBar = createBar(16 + barGap, COLORS.MANA_BAR, "MP");
    this.staminaBar = createBar(16 + barGap * 2, COLORS.STAMINA_BAR, "SP");
    this.xpBar = createBar(16 + barGap * 3, COLORS.XP_BAR, "XP");

    hudContainer.add([
      this.healthBar.bg,
      this.healthBar.fill,
      this.healthBar.text,
      this.manaBar.bg,
      this.manaBar.fill,
      this.manaBar.text,
      this.staminaBar.bg,
      this.staminaBar.fill,
      this.staminaBar.text,
      this.xpBar.bg,
      this.xpBar.fill,
      this.xpBar.text,
    ]);

    const titleText = this.add.text(20, 20, "Pixel Kingdom", {
      fontSize: "16px",
      fill: "#ffffff",
      fontFamily: "monospace",
    });
    titleText.setScrollFactor(0);
    titleText.setDepth(100);
  }

  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();

      const { width, height } = this.cameras.main;
      this.pauseOverlay = this.add.rectangle(
        width / 2, height / 2, width, height, 0x000000, 0.7
      );
      this.pauseOverlay.setScrollFactor(0);
      this.pauseOverlay.setDepth(200);

      this.pauseText = this.add.text(width / 2, height / 2, "PAUSED", {
        fontSize: "48px",
        fill: "#ffffff",
        fontFamily: "monospace",
      });
      this.pauseText.setOrigin(0.5);
      this.pauseText.setScrollFactor(0);
      this.pauseText.setDepth(201);
    } else {
      this.physics.resume();

      if (this.pauseOverlay) {
        this.pauseOverlay.destroy();
        this.pauseOverlay = null;
      }
      if (this.pauseText) {
        this.pauseText.destroy();
        this.pauseText = null;
      }
    }
  }

  update() {
    if (this.isPaused) return;

    this.player.move(this.cursors, this.wasd);

    this.updateHUD();
  }

  updateHUD() {
    const maxBarWidth = 156;

    const healthPercent = this.player.health / this.player.maxHealth;
    this.healthBar.fill.width = maxBarWidth * healthPercent;

    const manaPercent = this.player.mana / this.player.maxMana;
    this.manaBar.fill.width = maxBarWidth * manaPercent;

    const staminaPercent = this.player.stamina / this.player.maxStamina;
    this.staminaBar.fill.width = maxBarWidth * staminaPercent;

    const xpPercent = this.player.xp / this.player.xpToNextLevel;
    this.xpBar.fill.width = maxBarWidth * xpPercent;
  }
}
