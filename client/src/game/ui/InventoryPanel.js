import { COLORS } from "../constants.js";

export default class InventoryPanel {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.container = null;
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.render();
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

  render() {
    if (this.container) { this.container.destroy(); this.container = null; }

    const { width, height } = this.scene.cameras.main;
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(250);

    const overlay = this.scene.add.rectangle(
      width / 2, height / 2, width, height, 0x000000, 0.7
    );
    this.container.add(overlay);

    const pw = 460;
    const ph = 320;
    const px = width / 2;
    const py = height / 2;

    const panel = this.scene.add.rectangle(px, py, pw, ph, COLORS.UI_BG, 0.95);
    panel.setStrokeStyle(2, COLORS.UI_ACCENT);
    this.container.add(panel);

    const title = this.scene.add.text(px, py - ph / 2 + 18, "Inventory", {
      fontSize: "20px", fill: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
    });
    title.setOrigin(0.5);
    this.container.add(title);

    const goldText = this.scene.add.text(px + pw / 2 - 16, py - ph / 2 + 18, `Gold: ${this.scene.player.gold}`, {
      fontSize: "12px", fill: "#ffd700", fontFamily: "monospace",
    });
    goldText.setOrigin(1, 0.5);
    this.container.add(goldText);

    this.renderEquipmentSlots(px - pw / 4 + 20, py, ph);

    this.renderInventoryGrid(px + pw / 4 - 10, py, ph);

    const hint = this.scene.add.text(px, py + ph / 2 - 16, "Click item to use/equip | Press I or ESC to close", {
      fontSize: "10px", fill: "#888888", fontFamily: "monospace",
    });
    hint.setOrigin(0.5);
    this.container.add(hint);

    this.scene.tweens.add({
      targets: this.container,
      alpha: { from: 0, to: 1 },
      duration: 200,
    });
  }

  renderEquipmentSlots(cx, cy, ph) {
    const label = this.scene.add.text(cx, cy - ph / 2 + 44, "Equipment", {
      fontSize: "12px", fill: "#ffd700", fontFamily: "monospace", fontStyle: "bold",
    });
    label.setOrigin(0.5);
    this.container.add(label);

    const shop = this.scene.shopSystem;
    const equipped = shop ? shop.getEquipped() : {};
    const slots = [
      { key: "weapon", label: "Weapon", y: cy - 50 },
      { key: "armor", label: "Armor", y: cy },
      { key: "accessory", label: "Accessory", y: cy + 50 },
    ];

    slots.forEach(({ key, label: slotLabel, y }) => {
      const item = equipped[key];
      const bgColor = item ? 0x1a2a1a : 0x1a1a2e;
      const border = item ? 0x555555 : 0x333333;

      const slot = this.scene.add.rectangle(cx, y, 170, 40, bgColor, 0.8);
      slot.setStrokeStyle(1, border);
      this.container.add(slot);

      const typeColor = key === "weapon" ? "#aaaaaa" :
                        key === "armor" ? "#4488ff" : "#ffaa00";
      const typeIcon = this.scene.add.rectangle(cx - 65, y, 24, 24,
        key === "weapon" ? 0xaaaaaa : key === "armor" ? 0x4488ff : 0xffaa00, 0.7
      );
      this.container.add(typeIcon);

      const name = item ? item.name : "Empty";
      const nameText = this.scene.add.text(cx - 48, y - 6, name, {
        fontSize: "11px", fill: item ? typeColor : "#666666", fontFamily: "monospace",
      });
      nameText.setOrigin(0, 0.5);
      this.container.add(nameText);

      if (item) {
        const descText = this.scene.add.text(cx - 48, y + 8, item.description, {
          fontSize: "8px", fill: "#888888", fontFamily: "monospace",
        });
        descText.setOrigin(0, 0.5);
        this.container.add(descText);
      } else {
        const emptyText = this.scene.add.text(cx - 48, y + 8, slotLabel, {
          fontSize: "9px", fill: "#555555", fontFamily: "monospace",
        });
        emptyText.setOrigin(0, 0.5);
        this.container.add(emptyText);
      }
    });

    const statsLabel = this.scene.add.text(cx, cy + 90, "Stats", {
      fontSize: "10px", fill: "#aaaaaa", fontFamily: "monospace", fontStyle: "bold",
    });
    statsLabel.setOrigin(0.5);
    this.container.add(statsLabel);

    const player = this.scene.player;
    const stats = [
      `ATK: ${player.attackDamage}`,
      `DEF: ${Math.floor(player.damageReduction * 100)}%`,
      `SPD: ${player.speed}`,
      `CRT: ${Math.floor((player.critChance || 0.15) * 100)}%`,
    ];

    stats.forEach((stat, i) => {
      const sx = cx - 40 + (i % 2) * 80;
      const sy = cy + 108 + Math.floor(i / 2) * 16;
      const statText = this.scene.add.text(sx, sy, stat, {
        fontSize: "9px", fill: "#aaaaaa", fontFamily: "monospace",
      });
      statText.setOrigin(0, 0.5);
      this.container.add(statText);
    });
  }

  renderInventoryGrid(cx, cy, ph) {
    const label = this.scene.add.text(cx, cy - ph / 2 + 44, "Items", {
      fontSize: "12px", fill: "#ffd700", fontFamily: "monospace", fontStyle: "bold",
    });
    label.setOrigin(0.5);
    this.container.add(label);

    const shop = this.scene.shopSystem;
    const items = shop ? shop.getInventory() : [];
    const slotSize = 44;
    const gap = 6;
    const cols = 4;
    const gridStartX = cx - (cols * (slotSize + gap)) / 2 + slotSize / 2;
    const gridStartY = cy - ph / 2 + 65;

    for (let i = 0; i < 16; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const sx = gridStartX + col * (slotSize + gap);
      const sy = gridStartY + row * (slotSize + gap);

      const slotBg = this.scene.add.rectangle(sx, sy, slotSize, slotSize, 0x1a1a2e);
      slotBg.setStrokeStyle(1, 0x333333);
      this.container.add(slotBg);

      if (i < items.length) {
        const item = items[i];

        const itemColor = item.type === "weapon" ? 0xaaaaaa :
                         item.type === "armor" ? 0x4488ff :
                         item.type === "accessory" ? 0xffaa00 :
                         item.type === "consumable" ? 0xff4444 : 0xffffff;

        const icon = this.scene.add.rectangle(sx, sy - 4, 28, 28, itemColor, 0.7);
        this.container.add(icon);

        const nameText = this.scene.add.text(sx, sy + 14, item.name.substring(0, 7), {
          fontSize: "7px", fill: "#aaaaaa", fontFamily: "monospace",
        });
        nameText.setOrigin(0.5);
        this.container.add(nameText);

        if (item.count > 1) {
          const countText = this.scene.add.text(sx + 16, sy - 16, `${item.count}`, {
            fontSize: "9px", fill: "#ffffff", fontFamily: "monospace",
            stroke: "#000000", strokeThickness: 2,
          });
          this.container.add(countText);
        }

        slotBg.setInteractive({ useHandCursor: true });
        slotBg.on("pointerover", () => slotBg.setStrokeStyle(2, COLORS.UI_ACCENT));
        slotBg.on("pointerout", () => slotBg.setStrokeStyle(1, 0x333333));
        slotBg.on("pointerdown", () => {
          if (item.type === "consumable") {
            shop.useItem(i);
            this.render();
          } else {
            shop.equipItem(item);
            this.render();
          }
        });
      }
    }

    const emptyHint = this.scene.add.text(cx, gridStartY + 4 * (slotSize + gap) + 8, `${items.length}/16 slots`, {
      fontSize: "9px", fill: "#666666", fontFamily: "monospace",
    });
    emptyHint.setOrigin(0.5);
    this.container.add(emptyHint);
  }
}
