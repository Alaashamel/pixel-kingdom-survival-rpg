import Phaser from "phaser";
import { COLORS } from "../constants.js";

export default class AssetGenerator {
  constructor(scene) {
    this.scene = scene;
  }

  generateAll() {
    this.generatePlayer();
    this.generateGrassTiles();
    this.generateTree();
    this.generateRock();
    this.generateFlowers();
    this.generateWaterTiles();
    this.generateBridge();
    this.generatePathTiles();
    this.generateHouse();
    this.generateDungeonEntrance();
    this.generateBush();
    this.generateStump();
    this.generateEnemySlime();
    this.generateEnemySkeleton();
    this.generateParticles();
    this.generateUIElements();
  }

  generatePlayer() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    const s = 32;

    g.fillStyle(COLORS.PLAYER);
    g.fillRect(4, 2, 24, 28);

    g.fillStyle(COLORS.PLAYER_DARK);
    g.fillRect(4, 2, 24, 4);
    g.fillRect(4, 2, 4, 28);

    g.fillStyle(0xffffff);
    g.fillRect(10, 8, 4, 4);
    g.fillRect(18, 8, 4, 4);

    g.fillStyle(0x000000);
    g.fillRect(12, 10, 2, 2);
    g.fillRect(20, 10, 2, 2);

    g.fillStyle(COLORS.PLAYER);
    g.fillRect(12, 16, 8, 4);

    g.fillStyle(COLORS.PLAYER_DARK);
    g.fillRect(4, 30, 8, 2);
    g.fillRect(20, 30, 8, 2);

    g.generateTexture("player", s, s);
    g.destroy();
  }

  generateGrassTiles() {
    const colors = [COLORS.GRASS, COLORS.GRASS_DARK, COLORS.GRASS_LIGHT];
    const s = 32;

    colors.forEach((color, i) => {
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color);
      g.fillRect(0, 0, s, s);

      g.fillStyle(0x000000, 0.1);
      for (let j = 0; j < 6; j++) {
        const bx = Phaser.Math.Between(2, s - 4);
        const by = Phaser.Math.Between(2, s - 4);
        g.fillRect(bx, by, 2, 2);
      }

      g.generateTexture(`grass_${i}`, s, s);
      g.destroy();
    });
  }

  generateTree() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(COLORS.WOOD);
    g.fillRect(12, 28, 8, 20);

    g.fillStyle(COLORS.WOOD_DARK);
    g.fillRect(12, 28, 3, 20);

    g.fillStyle(COLORS.LEAF);
    g.fillCircle(16, 18, 14);

    g.fillStyle(COLORS.LEAF_DARK);
    g.fillCircle(12, 16, 10);

    g.fillStyle(0x43a047);
    g.fillCircle(20, 20, 8);

    g.generateTexture("tree", 32, 48);
    g.destroy();
  }

  generateRock() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(COLORS.ROCK);
    g.fillCircle(16, 18, 14);

    g.fillStyle(COLORS.ROCK_DARK);
    g.fillCircle(12, 16, 10);

    g.fillStyle(0xbdbdbd);
    g.fillCircle(18, 14, 6);

    g.generateTexture("rock", 32, 32);
    g.destroy();
  }

  generateFlowers() {
    const flowerColors = [
      { name: "flower_red", color: COLORS.FLOWER_RED },
      { name: "flower_yellow", color: COLORS.FLOWER_YELLOW },
      { name: "flower_blue", color: COLORS.FLOWER_BLUE },
    ];

    flowerColors.forEach(({ name, color }) => {
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

      g.fillStyle(0x558b2f);
      g.fillRect(6, 10, 2, 8);

      g.fillStyle(color);
      g.fillCircle(7, 8, 5);

      g.fillStyle(0xffffff);
      g.fillCircle(7, 8, 2);

      g.generateTexture(name, 16, 16);
      g.destroy();
    });
  }

  generateEnemySlime() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(COLORS.ENEMY_RED);
    g.fillCircle(16, 18, 12);

    g.fillStyle(COLORS.ENEMY_DARK);
    g.fillCircle(16, 20, 10);

    g.fillStyle(0xffffff);
    g.fillRect(10, 14, 4, 4);
    g.fillRect(18, 14, 4, 4);

    g.fillStyle(0x000000);
    g.fillRect(12, 16, 2, 2);
    g.fillRect(20, 16, 2, 2);

    g.generateTexture("slime", 32, 32);
    g.destroy();
  }

  generateWaterTiles() {
    const waterColors = [
      { name: "water_0", color: COLORS.WATER },
      { name: "water_1", color: COLORS.WATER_DARK },
    ];

    const s = 32;
    waterColors.forEach(({ name, color }) => {
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color);
      g.fillRect(0, 0, s, s);

      g.fillStyle(0xffffff, 0.15);
      for (let i = 0; i < 3; i++) {
        const wx = Phaser.Math.Between(4, s - 8);
        const wy = Phaser.Math.Between(4, s - 4);
        g.fillRect(wx, wy, 8, 2);
      }

      g.generateTexture(name, s, s);
      g.destroy();
    });
  }

  generateBridge() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(COLORS.WOOD);
    g.fillRect(0, 0, 64, 32);

    g.fillStyle(COLORS.WOOD_DARK);
    for (let i = 0; i < 64; i += 8) {
      g.fillRect(i, 0, 2, 32);
    }

    g.lineStyle(2, COLORS.WOOD_DARK);
    g.strokeRect(0, 0, 64, 32);

    g.fillStyle(COLORS.WOOD_DARK);
    g.fillRect(0, 0, 64, 3);
    g.fillRect(0, 29, 64, 3);

    g.generateTexture("bridge", 64, 32);
    g.destroy();
  }

  generatePathTiles() {
    const pathColors = [
      { name: "path_0", color: COLORS.DIRT },
      { name: "path_1", color: 0xa1887f },
    ];

    const s = 32;
    pathColors.forEach(({ name, color }) => {
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color);
      g.fillRect(0, 0, s, s);

      g.fillStyle(0x000000, 0.08);
      for (let i = 0; i < 5; i++) {
        const px = Phaser.Math.Between(2, s - 4);
        const py = Phaser.Math.Between(2, s - 4);
        g.fillRect(px, py, 3, 2);
      }

      g.generateTexture(name, s, s);
      g.destroy();
    });
  }

  generateHouse() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(0x8d6e63);
    g.fillRect(4, 16, 24, 16);

    g.fillStyle(0x6d4c41);
    g.fillTriangle(0, 16, 16, 0, 32, 16);

    g.fillStyle(0x5d4037);
    g.fillTriangle(0, 16, 16, 2, 32, 16);

    g.fillStyle(COLORS.WOOD_DARK);
    g.fillRect(12, 22, 8, 10);

    g.fillStyle(0x42a5f5);
    g.fillRect(6, 20, 5, 5);
    g.fillRect(21, 20, 5, 5);

    g.lineStyle(1, 0x3e2723);
    g.strokeRect(6, 20, 5, 5);
    g.strokeRect(21, 20, 5, 5);

    g.generateTexture("house", 32, 32);
    g.destroy();
  }

  generateDungeonEntrance() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(0x424242);
    g.fillRect(0, 8, 32, 24);

    g.fillStyle(0x616161);
    g.fillRect(0, 8, 32, 4);

    g.fillStyle(0x212121);
    g.fillRect(8, 14, 16, 18);

    g.fillStyle(0x1a1a1a);
    g.fillCircle(16, 20, 6);

    g.fillStyle(0xff6600);
    g.fillCircle(10, 16, 2);
    g.fillCircle(22, 16, 2);

    g.generateTexture("dungeon_entrance", 32, 32);
    g.destroy();
  }

  generateBush() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(0x2e7d32);
    g.fillCircle(12, 14, 10);

    g.fillStyle(0x388e3c);
    g.fillCircle(8, 12, 7);

    g.fillStyle(0x43a047);
    g.fillCircle(16, 10, 6);

    g.generateTexture("bush", 24, 24);
    g.destroy();
  }

  generateStump() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(COLORS.WOOD);
    g.fillCircle(12, 12, 10);

    g.fillStyle(COLORS.WOOD_DARK);
    g.fillCircle(12, 12, 7);

    g.fillStyle(0xa1887f);
    g.fillCircle(12, 12, 4);

    g.generateTexture("stump", 24, 24);
    g.destroy();
  }

  generateEnemySkeleton() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(0xeeeeee);
    g.fillRect(10, 4, 12, 20);

    g.fillStyle(0xdddddd);
    g.fillCircle(16, 6, 6);

    g.fillStyle(0x000000);
    g.fillRect(12, 5, 3, 3);
    g.fillRect(18, 5, 3, 3);

    g.fillStyle(0xcccccc);
    g.fillRect(12, 10, 2, 8);
    g.fillRect(18, 10, 2, 8);

    g.fillStyle(0xdddddd);
    g.fillRect(12, 24, 3, 6);
    g.fillRect(17, 24, 3, 6);

    g.generateTexture("skeleton", 32, 32);
    g.destroy();
  }

  generateParticles() {
    const particleColors = [0xffffff, COLORS.HEALTH_BAR, COLORS.MANA_BAR, COLORS.XP_BAR];

    particleColors.forEach((color, i) => {
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color);
      g.fillRect(0, 0, 4, 4);
      g.generateTexture(`particle_${i}`, 4, 4);
      g.destroy();
    });
  }

  generateUIElements() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(COLORS.UI_BG);
    g.fillRoundedRect(0, 0, 200, 20, 4);
    g.lineStyle(2, COLORS.UI_BORDER);
    g.strokeRoundedRect(0, 0, 200, 20, 4);
    g.generateTexture("bar_bg", 200, 20);
    g.destroy();

    const g2 = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g2.fillStyle(COLORS.HEALTH_BAR);
    g2.fillRoundedRect(0, 0, 196, 16, 3);
    g2.generateTexture("bar_health", 196, 16);
    g2.destroy();

    const g3 = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g3.fillStyle(COLORS.MANA_BAR);
    g3.fillRoundedRect(0, 0, 196, 16, 3);
    g3.generateTexture("bar_mana", 196, 16);
    g3.destroy();

    const g4 = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g4.fillStyle(COLORS.STAMINA_BAR);
    g4.fillRoundedRect(0, 0, 196, 16, 3);
    g4.generateTexture("bar_stamina", 196, 16);
    g4.destroy();

    const g5 = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g5.fillStyle(COLORS.XP_BAR);
    g5.fillRoundedRect(0, 0, 196, 16, 3);
    g5.generateTexture("bar_xp", 196, 16);
    g5.destroy();

    const g6 = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g6.fillStyle(0x000000, 0.5);
    g6.fillCircle(16, 16, 16);
    g6.lineStyle(2, 0xffffff, 0.8);
    g6.strokeCircle(16, 16, 16);
    g6.fillStyle(0xffffff, 0.6);
    g6.fillCircle(16, 12, 4);
    g6.generateTexture("joystick_base", 32, 32);
    g6.destroy();

    const g7 = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g7.fillStyle(0xffffff, 0.7);
    g7.fillCircle(12, 12, 12);
    g7.generateTexture("joystick_thumb", 24, 24);
    g7.destroy();
  }
}
