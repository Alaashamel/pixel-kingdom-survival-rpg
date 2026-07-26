import { COLORS } from "../constants.js";

export default class SaveLoadUI {
  constructor(scene, saveSystem) {
    this.scene = scene;
    this.saveSystem = saveSystem;
    this.container = null;
    this.isOpen = false;
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    const { width, height } = this.scene.cameras.main;

    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(300);

    const overlay = this.scene.add.rectangle(
      width / 2, height / 2, width, height, 0x000000, 0.8
    );
    this.container.add(overlay);

    const panelW = 360;
    const panelH = 280;
    const panelX = width / 2;
    const panelY = height / 2;

    const panelBg = this.scene.add.rectangle(
      panelX, panelY, panelW, panelH, COLORS.UI_BG, 0.95
    );
    panelBg.setStrokeStyle(2, COLORS.UI_ACCENT);
    this.container.add(panelBg);

    const title = this.scene.add.text(panelX, panelY - panelH / 2 + 20, "Save / Load", {
      fontSize: "20px",
      fill: "#ffffff",
      fontFamily: "monospace",
      fontStyle: "bold",
    });
    title.setOrigin(0.5);
    this.container.add(title);

    for (let i = 0; i < 3; i++) {
      const slotY = panelY - 60 + i * 60;
      const info = this.saveSystem.getSaveInfo(i);

      const slotBg = this.scene.add.rectangle(panelX, slotY, panelW - 40, 45, 0x1a1a2e);
      slotBg.setStrokeStyle(1, 0x333333);
      this.container.add(slotBg);

      const slotLabel = this.scene.add.text(panelX - 140, slotY - 12, `Slot ${i + 1}`, {
        fontSize: "14px",
        fill: "#ffffff",
        fontFamily: "monospace",
        fontStyle: "bold",
      });
      this.container.add(slotLabel);

      if (info) {
        const infoText = this.scene.add.text(
          panelX - 140, slotY + 6,
          `Lv.${info.level} - ${info.date}`,
          { fontSize: "10px", fill: "#aaaaaa", fontFamily: "monospace" }
        );
        this.container.add(infoText);

        const loadBtn = this.createSmallButton(
          panelX + 80, slotY, "Load", () => this.handleLoad(i)
        );
        this.container.add(loadBtn);

        const saveBtn = this.createSmallButton(
          panelX + 130, slotY, "Save", () => this.handleSave(i)
        );
        this.container.add(saveBtn);

        const delBtn = this.createSmallButton(
          panelX + 180, slotY, "Del", () => this.handleDelete(i)
        );
        this.container.add(delBtn);
      } else {
        const emptyText = this.scene.add.text(
          panelX - 140, slotY + 6,
          "Empty",
          { fontSize: "10px", fill: "#666666", fontFamily: "monospace" }
        );
        this.container.add(emptyText);

        const saveBtn = this.createSmallButton(
          panelX + 130, slotY, "Save", () => this.handleSave(i)
        );
        this.container.add(saveBtn);
      }
    }

    const closeBtn = this.createSmallButton(
      panelX, panelY + panelH / 2 - 25, "Close", () => this.close()
    );
    this.container.add(closeBtn);

    this.scene.tweens.add({
      targets: this.container,
      alpha: { from: 0, to: 1 },
      duration: 200,
    });
  }

  createSmallButton(x, y, label, callback) {
    const bg = this.scene.add.rectangle(x, y, 42, 22, 0x333333);
    bg.setStrokeStyle(1, 0x555555);
    bg.setInteractive({ useHandCursor: true });

    const text = this.scene.add.text(x, y, label, {
      fontSize: "10px",
      fill: "#ffffff",
      fontFamily: "monospace",
    });
    text.setOrigin(0.5);

    bg.on("pointerover", () => bg.setFillStyle(0x555555));
    bg.on("pointerout", () => bg.setFillStyle(0x333333));
    bg.on("pointerdown", () => {
      if (this.scene.game.audioSystem) {
        this.scene.game.audioSystem.playUIClick();
      }
      callback();
    });

    const container = this.scene.add.container(0, 0);
    container.add([bg, text]);
    return container;
  }

  handleSave(slot) {
    if (!this.scene.player) return;
    const p = this.scene.player;
    const success = this.saveSystem.save(slot, {
      health: p.health,
      maxHealth: p.maxHealth,
      mana: p.mana,
      maxMana: p.maxMana,
      stamina: p.stamina,
      maxStamina: p.maxStamina,
      level: p.level,
      xp: p.xp,
      xpToNextLevel: p.xpToNextLevel,
      attackDamage: p.attackDamage,
      x: p.x,
      y: p.y,
    });

    if (success) {
      this.close();
      this.open();
    }
  }

  handleLoad(slot) {
    const data = this.saveSystem.load(slot);
    if (!data || !this.scene.player) return;

    const p = this.scene.player;
    p.health = data.player.health;
    p.maxHealth = data.player.maxHealth;
    p.mana = data.player.mana;
    p.maxMana = data.player.maxMana;
    p.stamina = data.player.stamina;
    p.maxStamina = data.player.maxStamina;
    p.level = data.player.level;
    p.xp = data.player.xp;
    p.xpToNextLevel = data.player.xpToNextLevel;
    p.attackDamage = data.player.attackDamage;
    p.setPosition(data.player.x, data.player.y);

    this.close();
  }

  handleDelete(slot) {
    this.saveSystem.delete(slot);
    this.close();
    this.open();
  }

  close() {
    if (!this.isOpen || !this.container) return;
    this.isOpen = false;

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        if (this.container) {
          this.container.destroy();
          this.container = null;
        }
      },
    });
  }
}
