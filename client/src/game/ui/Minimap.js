import Phaser from "phaser";
import { WORLD, COLORS } from "../constants.js";

export default class Minimap {
  constructor(scene) {
    this.scene = scene;
    this.size = 140;
    this.margin = 10;
    this.scale = this.size / WORLD.WIDTH;
    this.maxDots = 50;

    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(150);

    this.createBackground();
    this.createPlayerDot();
    this.createEnemyDots();
  }

  createBackground() {
    const x = this.scene.cameras.main.width - this.size - this.margin;
    const y = this.scene.cameras.main.height - this.size - this.margin;

    this.bg = this.scene.add.rectangle(
      x + this.size / 2,
      y + this.size / 2,
      this.size,
      this.size,
      0x000000,
      0.6
    );
    this.bg.setStrokeStyle(2, COLORS.UI_ACCENT);
    this.container.add(this.bg);

    this.createMinimapTerrain(x, y);
  }

  createMinimapTerrain(startX, startY) {
    const tileSize = 8;
    const worldTileSize = 32;
    const cols = Math.ceil(this.size / tileSize);
    const rows = Math.ceil(this.size / tileSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const worldX = (col / cols) * WORLD.WIDTH;
        const worldY = (row / rows) * WORLD.HEIGHT;

        let color = COLORS.GRASS;
        const noise = Math.sin(worldX * 0.01) * Math.cos(worldY * 0.01);

        if (noise > 0.3) color = COLORS.GRASS_DARK;
        else if (noise < -0.3) color = COLORS.GRASS_LIGHT;

        const riverX = WORLD.WIDTH * 0.7 + Math.sin(worldY * 0.005) * worldTileSize * 2;
        if (Math.abs(worldX - riverX) < worldTileSize * 3) {
          color = COLORS.WATER;
        }

        const pondDist = Phaser.Math.Distance.Between(
          worldX, worldY,
          WORLD.WIDTH * 0.25, WORLD.HEIGHT * 0.25
        );
        if (pondDist < worldTileSize * 6) {
          color = COLORS.WATER;
        }

        const pixel = this.scene.add.rectangle(
          startX + col * tileSize + tileSize / 2,
          startY + row * tileSize + tileSize / 2,
          tileSize,
          tileSize,
          color,
          0.8
        );
        this.container.add(pixel);
      }
    }

    const villageX = startX + (WORLD.WIDTH * 0.2 / WORLD.WIDTH) * this.size;
    const villageY = startY + (WORLD.HEIGHT * 0.6 / WORLD.HEIGHT) * this.size;
    const villageMarker = this.scene.add.rectangle(villageX, villageY, 6, 6, 0xffee58);
    this.container.add(villageMarker);

    const dungeonX = startX + (WORLD.WIDTH * 0.8 / WORLD.WIDTH) * this.size;
    const dungeonY = startY + (WORLD.HEIGHT * 0.8 / WORLD.HEIGHT) * this.size;
    const dungeonMarker = this.scene.add.rectangle(dungeonX, dungeonY, 6, 6, 0xff6600);
    this.container.add(dungeonMarker);
  }

  createPlayerDot() {
    this.playerDot = this.scene.add.circle(0, 0, 3, COLORS.PLAYER);
    this.container.add(this.playerDot);
  }

  createEnemyDots() {
    this.enemyDots = [];
    for (let i = 0; i < this.maxDots; i++) {
      const dot = this.scene.add.circle(0, 0, 2, COLORS.ENEMY_RED, 0.8);
      dot.setVisible(false);
      this.container.add(dot);
      this.enemyDots.push(dot);
    }
  }

  update(player, enemies) {
    const mapX = this.scene.cameras.main.width - this.size - this.margin;
    const mapY = this.scene.cameras.main.height - this.size - this.margin;

    const playerMapX = mapX + (player.x / WORLD.WIDTH) * this.size;
    const playerMapY = mapY + (player.y / WORLD.HEIGHT) * this.size;
    this.playerDot.setPosition(playerMapX, playerMapY);

    let dotIndex = 0;
    if (enemies) {
      const children = enemies.getChildren();
      for (let i = 0; i < children.length && dotIndex < this.maxDots; i++) {
        const enemy = children[i];
        if (!enemy || !enemy.isAlive) continue;

        const ex = mapX + (enemy.x / WORLD.WIDTH) * this.size;
        const ey = mapY + (enemy.y / WORLD.HEIGHT) * this.size;

        this.enemyDots[dotIndex].setPosition(ex, ey);
        this.enemyDots[dotIndex].setVisible(true);
        dotIndex++;
      }
    }

    for (let i = dotIndex; i < this.maxDots; i++) {
      this.enemyDots[i].setVisible(false);
    }
  }

  destroy() {
    this.container.destroy();
  }
}
