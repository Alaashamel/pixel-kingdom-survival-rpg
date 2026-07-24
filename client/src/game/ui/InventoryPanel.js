import { COLORS } from "../constants.js";

export default class InventoryPanel {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.container = null;
    this.slots = [];
    this.selectedSlot = 0;

    this.items = [
      { name: "Sword", icon: "sword", type: "weapon", count: 1 },
      { name: "Shield", icon: "shield", type: "armor", count: 1 },
      { name: "Health Potion", icon: "potion_red", type: "consumable", count: 5 },
      { name: "Mana Potion", icon: "potion_blue", type: "consumable", count: 3 },
    ];
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

    const { width, height } = this.scene.cameras.main;

    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(250);

    const overlay = this.scene.add.rectangle(
      width / 2, height / 2, width, height, 0x000000, 0.7
    );
    this.container.add(overlay);

    const panelWidth = 400;
    const panelHeight = 300;
    const panelX = width / 2;
    const panelY = height / 2;

    const panelBg = this.scene.add.rectangle(
      panelX, panelY, panelWidth, panelHeight, COLORS.UI_BG, 0.95
    );
    panelBg.setStrokeStyle(2, COLORS.UI_ACCENT);
    this.container.add(panelBg);

    const title = this.scene.add.text(panelX, panelY - panelHeight / 2 + 20, "Inventory", {
      fontSize: "20px",
      fill: "#ffffff",
      fontFamily: "monospace",
      fontStyle: "bold",
    });
    title.setOrigin(0.5);
    this.container.add(title);

    const slotSize = 50;
    const slotGap = 8;
    const slotsPerRow = 6;
    const startX = panelX - (slotsPerRow * (slotSize + slotGap)) / 2 + slotSize / 2;
    const startY = panelY - 40;

    for (let i = 0; i < 12; i++) {
      const row = Math.floor(i / slotsPerRow);
      const col = i % slotsPerRow;
      const sx = startX + col * (slotSize + slotGap);
      const sy = startY + row * (slotSize + slotGap);

      const slotBg = this.scene.add.rectangle(sx, sy, slotSize, slotSize, 0x1a1a2e);
      slotBg.setStrokeStyle(1, 0x333333);
      this.container.add(slotBg);

      if (i < this.items.length) {
        const item = this.items[i];

        const itemColor = item.type === "weapon" ? 0xaaaaaa :
                         item.type === "armor" ? 0x4488ff :
                         item.type === "consumable" ? 0xff4444 : 0xffffff;

        const itemIcon = this.scene.add.rectangle(sx, sy - 5, 30, 30, itemColor, 0.8);
        this.container.add(itemIcon);

        const itemName = this.scene.add.text(sx, sy + 16, item.name.substring(0, 6), {
          fontSize: "8px",
          fill: "#aaaaaa",
          fontFamily: "monospace",
        });
        itemName.setOrigin(0.5);
        this.container.add(itemName);

        if (item.count > 1) {
          const countText = this.scene.add.text(sx + 18, sy - 18, `${item.count}`, {
            fontSize: "10px",
            fill: "#ffffff",
            fontFamily: "monospace",
            stroke: "#000000",
            strokeThickness: 2,
          });
          this.container.add(countText);
        }
      }

      this.slots.push({ bg: slotBg, index: i });
    }

    const closeText = this.scene.add.text(panelX, panelY + panelHeight / 2 - 20, "Press I or ESC to close", {
      fontSize: "12px",
      fill: "#888888",
      fontFamily: "monospace",
    });
    closeText.setOrigin(0.5);
    this.container.add(closeText);

    this.scene.tweens.add({
      targets: this.container,
      alpha: { from: 0, to: 1 },
      duration: 200,
    });
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
        this.slots = [];
      },
    });
  }
}
