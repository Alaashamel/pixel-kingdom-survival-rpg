import { COLORS } from "../constants.js";

export default class ShopUI {
  constructor(scene, shopSystem) {
    this.scene = scene;
    this.shop = shopSystem;
    this.isOpen = false;
    this.container = null;
    this.activeTab = "buy";
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.activeTab = "buy";
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
        if (this.container) { this.container.destroy(); this.container = null; }
      },
    });
  }

  render() {
    if (this.container) { this.container.destroy(); this.container = null; }

    const { width, height } = this.scene.cameras.main;
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(260);

    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75);
    this.container.add(overlay);

    const pw = 480;
    const ph = 380;
    const px = width / 2;
    const py = height / 2;

    const panel = this.scene.add.rectangle(px, py, pw, ph, COLORS.UI_BG, 0.95);
    panel.setStrokeStyle(2, COLORS.GOLD);
    this.container.add(panel);

    const title = this.scene.add.text(px, py - ph / 2 + 18, "SHOP", {
      fontSize: "22px", fill: "#ffd700", fontFamily: "monospace", fontStyle: "bold",
    });
    title.setOrigin(0.5);
    this.container.add(title);

    const goldText = this.scene.add.text(px + pw / 2 - 16, py - ph / 2 + 18, `Gold: ${this.scene.player.gold}`, {
      fontSize: "14px", fill: "#ffd700", fontFamily: "monospace",
    });
    goldText.setOrigin(1, 0.5);
    this.container.add(goldText);
    this.goldText = goldText;

    const tabY = py - ph / 2 + 50;
    const buyTab = this.scene.add.rectangle(px - 60, tabY, 100, 28, this.activeTab === "buy" ? COLORS.GOLD : 0x333333);
    buyTab.setStrokeStyle(1, COLORS.GOLD);
    buyTab.setInteractive({ useHandCursor: true });
    buyTab.on("pointerdown", () => { this.activeTab = "buy"; this.render(); });
    this.container.add(buyTab);

    const buyLabel = this.scene.add.text(px - 60, tabY, "BUY", {
      fontSize: "14px", fill: this.activeTab === "buy" ? "#000000" : "#ffffff", fontFamily: "monospace", fontStyle: "bold",
    });
    buyLabel.setOrigin(0.5);
    this.container.add(buyLabel);

    const sellTab = this.scene.add.rectangle(px + 60, tabY, 100, 28, this.activeTab === "sell" ? COLORS.GOLD : 0x333333);
    sellTab.setStrokeStyle(1, COLORS.GOLD);
    sellTab.setInteractive({ useHandCursor: true });
    sellTab.on("pointerdown", () => { this.activeTab = "sell"; this.render(); });
    this.container.add(sellTab);

    const sellLabel = this.scene.add.text(px + 60, tabY, "SELL", {
      fontSize: "14px", fill: this.activeTab === "sell" ? "#000000" : "#ffffff", fontFamily: "monospace", fontStyle: "bold",
    });
    sellLabel.setOrigin(0.5);
    this.container.add(sellLabel);

    if (this.activeTab === "buy") {
      this.renderBuyTab(px, py, pw, ph);
    } else {
      this.renderSellTab(px, py, pw, ph);
    }

    const closeHint = this.scene.add.text(px, py + ph / 2 - 16, "Press B or ESC to close", {
      fontSize: "11px", fill: "#888888", fontFamily: "monospace",
    });
    closeHint.setOrigin(0.5);
    this.container.add(closeHint);

    this.scene.tweens.add({
      targets: this.container,
      alpha: { from: 0, to: 1 },
      duration: 200,
    });
  }

  renderBuyTab(px, py, pw, ph) {
    const items = this.shop.getAvailableItems();
    const startY = py - ph / 2 + 75;
    const itemH = 30;
    const scrollAreaBottom = py + ph / 2 - 35;

    items.forEach((item, i) => {
      const iy = startY + i * itemH;
      if (iy > scrollAreaBottom) return;

      const canAfford = this.scene.player.gold >= item.price;

      const row = this.scene.add.rectangle(px, iy, pw - 40, itemH - 4, canAfford ? 0x1a2a1a : 0x2a1a1a, 0.8);
      row.setStrokeStyle(1, canAfford ? 0x333333 : 0x442222);
      row.setInteractive({ useHandCursor: true });

      const typeColor = item.type === "weapon" ? "#aaaaaa" :
                        item.type === "armor" ? "#4488ff" :
                        item.type === "accessory" ? "#ffaa00" : "#ff4444";

      const nameText = this.scene.add.text(px - pw / 2 + 30, iy, `${item.name}`, {
        fontSize: "12px", fill: typeColor, fontFamily: "monospace",
      });
      nameText.setOrigin(0, 0.5);
      this.container.add(nameText);

      const descText = this.scene.add.text(px - pw / 2 + 180, iy, item.description, {
        fontSize: "10px", fill: "#888888", fontFamily: "monospace",
      });
      descText.setOrigin(0, 0.5);
      this.container.add(descText);

      const priceText = this.scene.add.text(px + pw / 2 - 30, iy, `${item.price}g`, {
        fontSize: "12px", fill: canAfford ? "#ffd700" : "#ff4444", fontFamily: "monospace", fontStyle: "bold",
      });
      priceText.setOrigin(1, 0.5);
      this.container.add(priceText);

      if (canAfford) {
        row.on("pointerdown", () => {
          const result = this.shop.buyItem(item.id);
          if (result.success && this.scene.game.audioSystem) {
            try { this.scene.game.audioSystem.playLevelUp(); } catch { /* ignore */ }
          }
          this.render();
        });
        row.on("pointerover", () => row.setFillStyle(0x2a3a2a));
        row.on("pointerout", () => row.setFillStyle(0x1a2a1a, 0.8));
      }

      this.container.add(row);
    });
  }

  renderSellTab(px, py, pw, ph) {
    const inv = this.shop.getInventory();
    const startY = py - ph / 2 + 75;
    const itemH = 30;

    if (inv.length === 0) {
      const empty = this.scene.add.text(px, py, "No items to sell", {
        fontSize: "14px", fill: "#888888", fontFamily: "monospace",
      });
      empty.setOrigin(0.5);
      this.container.add(empty);
      return;
    }

    inv.forEach((item, i) => {
      const iy = startY + i * itemH;

      const row = this.scene.add.rectangle(px, iy, pw - 40, itemH - 4, 0x1a1a2a, 0.8);
      row.setStrokeStyle(1, 0x333333);
      row.setInteractive({ useHandCursor: true });

      const typeColor = item.type === "weapon" ? "#aaaaaa" :
                        item.type === "armor" ? "#4488ff" :
                        item.type === "accessory" ? "#ffaa00" : "#ff4444";

      const countStr = item.count > 1 ? ` x${item.count}` : "";
      const nameText = this.scene.add.text(px - pw / 2 + 30, iy, `${item.name}${countStr}`, {
        fontSize: "12px", fill: typeColor, fontFamily: "monospace",
      });
      nameText.setOrigin(0, 0.5);
      this.container.add(nameText);

      const priceText = this.scene.add.text(px + pw / 2 - 30, iy, `${item.sellPrice}g`, {
        fontSize: "12px", fill: "#ffd700", fontFamily: "monospace", fontStyle: "bold",
      });
      priceText.setOrigin(1, 0.5);
      this.container.add(priceText);

      row.on("pointerdown", () => {
        this.shop.sellItem(i);
        this.render();
      });
      row.on("pointerover", () => row.setFillStyle(0x2a2a3a));
      row.on("pointerout", () => row.setFillStyle(0x1a1a2a, 0.8));

      this.container.add(row);
    });
  }

  updateGoldDisplay() {
    if (this.goldText && this.scene.player) {
      this.goldText.setText(`Gold: ${this.scene.player.gold}`);
    }
  }
}
