import Phaser from "phaser";
import { WORLD } from "../constants.js";

class World {
  constructor(scene) {
    this.scene = scene;
    this.width = WORLD.WIDTH;
    this.height = WORLD.HEIGHT;
    this.treeGroup = null;
    this.rockGroup = null;
  }

  create() {
    this.scene.physics.world.setBounds(0, 0, this.width, this.height);

    this.createGround();
    this.createEnvironment();

    this.scene.physics.world.gravity.y = 0;
  }

  createGround() {
    const tileSize = 32;
    const cols = Math.ceil(this.width / tileSize);
    const rows = Math.ceil(this.height / tileSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const variant = Phaser.Math.Between(0, 2);
        const x = col * tileSize + tileSize / 2;
        const y = row * tileSize + tileSize / 2;

        this.scene.add.image(x, y, `grass_${variant}`).setDepth(0);
      }
    }
  }

  createEnvironment() {
    this.treeGroup = this.scene.physics.add.staticGroup();
    this.rockGroup = this.scene.physics.add.staticGroup();

    this.createTrees();
    this.createRocks();
    this.createFlowers();
    this.createBorderDecorations();
  }

  createTrees() {
    const treeCount = 120;
    const margin = 200;
    const minDist = 80;

    for (let i = 0; i < treeCount; i++) {
      let x, y;
      let attempts = 0;

      do {
        x = Phaser.Math.Between(margin, this.width - margin);
        y = Phaser.Math.Between(margin, this.height - margin);
        attempts++;
      } while (attempts < 20 && this.isTooCloseToPlayer(x, y, minDist));

      const tree = this.treeGroup.create(x, y, "tree");
      tree.setDepth(5);
      tree.body.setSize(16, 16);
      tree.body.setOffset(8, 32);
    }
  }

  createRocks() {
    const rockCount = 60;
    const margin = 150;

    for (let i = 0; i < rockCount; i++) {
      const x = Phaser.Math.Between(margin, this.width - margin);
      const y = Phaser.Math.Between(margin, this.height - margin);

      if (this.isTooCloseToPlayer(x, y, 60)) continue;

      const rock = this.rockGroup.create(x, y, "rock");
      rock.setDepth(3);
      rock.setScale(Phaser.Math.FloatBetween(0.6, 1.2));
      rock.body.setSize(20, 20);
      rock.body.setOffset(6, 12);
    }
  }

  createFlowers() {
    const flowerTypes = ["flower_red", "flower_yellow", "flower_blue"];
    const flowerCount = 200;
    const margin = 100;

    for (let i = 0; i < flowerCount; i++) {
      const x = Phaser.Math.Between(margin, this.width - margin);
      const y = Phaser.Math.Between(margin, this.height - margin);
      const type = Phaser.Utils.Array.GetRandom(flowerTypes);

      const flower = this.scene.add.image(x, y, type);
      flower.setDepth(1);
      flower.setScale(Phaser.Math.FloatBetween(0.8, 1.2));
      flower.setAlpha(Phaser.Math.FloatBetween(0.7, 1));

      this.scene.tweens.add({
        targets: flower,
        scaleX: flower.scaleX * 1.1,
        scaleY: flower.scaleY * 1.1,
        duration: Phaser.Math.Between(1000, 2000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  createBorderDecorations() {
    const borderWidth = 64;
    const tileSize = 32;

    for (let x = 0; x < this.width; x += tileSize) {
      for (let offset = 0; offset < borderWidth; offset += tileSize) {
        if (Phaser.Math.Between(0, 3) === 0) {
          this.scene.add.image(
            x + tileSize / 2,
            offset + tileSize / 2,
            "rock"
          ).setDepth(2).setScale(0.5).setAlpha(0.5);
        }
        if (Phaser.Math.Between(0, 3) === 0) {
          this.scene.add.image(
            x + tileSize / 2,
            this.height - offset - tileSize / 2,
            "rock"
          ).setDepth(2).setScale(0.5).setAlpha(0.5);
        }
      }
    }

    for (let y = 0; y < this.height; y += tileSize) {
      for (let offset = 0; offset < borderWidth; offset += tileSize) {
        if (Phaser.Math.Between(0, 3) === 0) {
          this.scene.add.image(
            offset + tileSize / 2,
            y + tileSize / 2,
            "rock"
          ).setDepth(2).setScale(0.5).setAlpha(0.5);
        }
        if (Phaser.Math.Between(0, 3) === 0) {
          this.scene.add.image(
            this.width - offset - tileSize / 2,
            y + tileSize / 2,
            "rock"
          ).setDepth(2).setScale(0.5).setAlpha(0.5);
        }
      }
    }
  }

  isTooCloseToPlayer(x, y, minDist) {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const dist = Phaser.Math.Distance.Between(x, y, centerX, centerY);
    return dist < minDist;
  }
}

export default World;
