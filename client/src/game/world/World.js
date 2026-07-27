import Phaser from "phaser";
import { WORLD } from "../constants.js";

class World {
  constructor(scene) {
    this.scene = scene;
    this.width = WORLD.WIDTH;
    this.height = WORLD.HEIGHT;
    this.treeGroup = null;
    this.rockGroup = null;
    this.waterGroup = null;
    this.waterTiles = new Set();
  }

  create() {
    this.scene.physics.world.setBounds(0, 0, this.width, this.height);

    this.createGround();
    this.createWater();
    this.createPaths();
    this.createVillage();
    this.createDungeonArea();
    this.createEnvironment();
    this.createBorderDecorations();

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

  createWater() {
    this.waterGroup = this.scene.physics.add.staticGroup();

    const tileSize = 32;
    const riverStartX = this.width * 0.7;
    const riverWidth = 5;

    for (let y = 0; y < this.height; y += tileSize) {
      const offsetX = Math.sin(y * 0.005) * tileSize * 2;
      const centerX = riverStartX + offsetX;

      for (let w = -riverWidth; w <= riverWidth; w++) {
        const x = centerX + w * tileSize;
        const tileKey = `${Math.floor(x / tileSize)},${Math.floor(y / tileSize)}`;

        if (!this.waterTiles.has(tileKey)) {
          this.waterTiles.add(tileKey);
          const variant = Math.abs(w) >= riverWidth - 1 ? 1 : 0;
          const tile = this.waterGroup.create(x, y, `water_${variant}`);
          tile.setDepth(0);
          tile.body.setSize(tileSize, tileSize);
        }
      }
    }

    const pondCenterX = this.width * 0.25;
    const pondCenterY = this.height * 0.25;
    const pondRadius = 6;

    for (let dy = -pondRadius; dy <= pondRadius; dy++) {
      for (let dx = -pondRadius; dx <= pondRadius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= pondRadius) {
          const x = pondCenterX + dx * tileSize;
          const y = pondCenterY + dy * tileSize;
          const tileKey = `${Math.floor(x / tileSize)},${Math.floor(y / tileSize)}`;

          if (!this.waterTiles.has(tileKey)) {
            this.waterTiles.add(tileKey);
            const variant = dist > pondRadius - 1 ? 1 : 0;
            const tile = this.waterGroup.create(x, y, `water_${variant}`);
            tile.setDepth(0);
            tile.body.setSize(tileSize, tileSize);
          }
        }
      }
    }
  }

  createPaths() {
    const tileSize = 32;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    const pathConfigs = [
      { startX: centerX, startY: centerY, endX: centerX, endY: 200, horizontal: false },
      { startX: centerX, startY: centerY, endX: this.width - 200, endY: centerY, horizontal: true },
      { startX: centerX, startY: centerY, endX: this.width * 0.7, endY: this.height * 0.3, horizontal: true },
    ];

    pathConfigs.forEach(({ startX, startY, endX, endY, horizontal }) => {
      const steps = Math.ceil(
        Phaser.Math.Distance.Between(startX, startY, endX, endY) / tileSize
      );

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = Phaser.Math.Linear(startX, endX, t);
        const y = Phaser.Math.Linear(startY, endY, t);

        for (let offset = -1; offset <= 1; offset++) {
          const px = horizontal ? x : x + offset * tileSize;
          const py = horizontal ? y + offset * tileSize : y;
          const tileKey = `path_${Math.floor(px / tileSize)},${Math.floor(py / tileSize)}`;

          if (!this.waterTiles.has(tileKey)) {
            const variant = Phaser.Math.Between(0, 1);
            const tile = this.scene.add.image(px, py, `path_${variant}`);
            tile.setDepth(0);
          }
        }
      }
    });
  }

  createVillage() {
    const tileSize = 32;
    const villageX = this.width * 0.2;
    const villageY = this.height * 0.6;
    const housePositions = [
      { dx: 0, dy: 0 },
      { dx: 80, dy: -40 },
      { dx: -60, dy: -60 },
      { dx: 40, dy: 60 },
      { dx: -80, dy: 20 },
    ];

    housePositions.forEach(({ dx, dy }) => {
      const x = villageX + dx;
      const y = villageY + dy;

      const house = this.scene.add.image(x, y, "house");
      house.setDepth(4);
      house.setScale(2);

      for (let bx = -1; bx <= 1; bx++) {
        for (let by = -1; by <= 1; by++) {
          if (bx === 0 && by === 0) continue;
          const tile = this.scene.add.image(
            x + bx * tileSize,
            y + by * tileSize,
            "path_0"
          );
          tile.setDepth(0);
        }
      }
    });

    const signX = villageX + 120;
    const signY = villageY - 20;
    const signText = this.scene.add.text(signX, signY, "Village", {
      fontSize: "12px",
      fill: "#ffffff",
      fontFamily: "monospace",
      stroke: "#000000",
      strokeThickness: 2,
    });
    signText.setOrigin(0.5);
    signText.setDepth(10);

    this.shopkeeperX = villageX;
    this.shopkeeperY = villageY - 80;

    const shopkeeper = this.scene.add.image(this.shopkeeperX, this.shopkeeperY, "shopkeeper");
    shopkeeper.setDepth(5);
    shopkeeper.setScale(2);

    const shopLabel = this.scene.add.text(this.shopkeeperX, this.shopkeeperY - 40, "SHOP", {
      fontSize: "10px",
      fill: "#ffd700",
      fontFamily: "monospace",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
    shopLabel.setOrigin(0.5);
    shopLabel.setDepth(10);

    this.scene.tweens.add({
      targets: shopLabel,
      y: shopLabel.y - 4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  createDungeonArea() {
    const dungeonX = this.width * 0.8;
    const dungeonY = this.height * 0.8;
    const tileSize = 32;

    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const x = dungeonX + dx * tileSize;
        const y = dungeonY + dy * tileSize;
        const tileKey = `${Math.floor(x / tileSize)},${Math.floor(y / tileSize)}`;

        if (!this.waterTiles.has(tileKey)) {
          const tile = this.scene.add.image(x, y, "path_1");
          tile.setDepth(0);
        }
      }
    }

    const entrance = this.scene.add.image(dungeonX, dungeonY, "dungeon_entrance");
    entrance.setDepth(5);
    entrance.setScale(2.5);

    const dungeonText = this.scene.add.text(dungeonX, dungeonY - 50, "Dungeon", {
      fontSize: "12px",
      fill: "#ff6600",
      fontFamily: "monospace",
      stroke: "#000000",
      strokeThickness: 2,
    });
    dungeonText.setOrigin(0.5);
    dungeonText.setDepth(10);

    this.scene.tweens.add({
      targets: dungeonText,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }

  createEnvironment() {
    this.treeGroup = this.scene.physics.add.staticGroup();
    this.rockGroup = this.scene.physics.add.staticGroup();

    this.createTrees();
    this.createRocks();
    this.createFlowers();
    this.createBushes();
    this.createStumps();
  }

  createTrees() {
    const treeCount = 100;
    const margin = 200;
    const minDist = 80;

    for (let i = 0; i < treeCount; i++) {
      let x, y;
      let attempts = 0;

      do {
        x = Phaser.Math.Between(margin, this.width - margin);
        y = Phaser.Math.Between(margin, this.height - margin);
        attempts++;
      } while (
        attempts < 30 &&
        (this.isTooCloseToCenter(x, y, minDist) || this.isInWater(x, y))
      );

      const tree = this.treeGroup.create(x, y, "tree");
      tree.setDepth(5);
      tree.body.setSize(16, 16);
      tree.body.setOffset(8, 32);
    }
  }

  createRocks() {
    const rockCount = 50;
    const margin = 150;

    for (let i = 0; i < rockCount; i++) {
      const x = Phaser.Math.Between(margin, this.width - margin);
      const y = Phaser.Math.Between(margin, this.height - margin);

      if (this.isTooCloseToCenter(x, y, 60) || this.isInWater(x, y)) continue;

      const rock = this.rockGroup.create(x, y, "rock");
      rock.setDepth(3);
      rock.setScale(Phaser.Math.FloatBetween(0.6, 1.2));
      rock.body.setSize(20, 20);
      rock.body.setOffset(6, 12);
    }
  }

  createFlowers() {
    const flowerTypes = ["flower_red", "flower_yellow", "flower_blue"];
    const flowerCount = 150;
    const margin = 100;

    for (let i = 0; i < flowerCount; i++) {
      const x = Phaser.Math.Between(margin, this.width - margin);
      const y = Phaser.Math.Between(margin, this.height - margin);

      if (this.isInWater(x, y)) continue;

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

  createBushes() {
    const bushCount = 40;
    const margin = 150;

    for (let i = 0; i < bushCount; i++) {
      const x = Phaser.Math.Between(margin, this.width - margin);
      const y = Phaser.Math.Between(margin, this.height - margin);

      if (this.isInWater(x, y)) continue;

      const bush = this.scene.add.image(x, y, "bush");
      bush.setDepth(2);
      bush.setScale(Phaser.Math.FloatBetween(0.8, 1.3));
    }
  }

  createStumps() {
    const stumpCount = 20;
    const margin = 200;

    for (let i = 0; i < stumpCount; i++) {
      const x = Phaser.Math.Between(margin, this.width - margin);
      const y = Phaser.Math.Between(margin, this.height - margin);

      if (this.isInWater(x, y)) continue;

      const stump = this.scene.add.image(x, y, "stump");
      stump.setDepth(2);
      stump.setScale(Phaser.Math.FloatBetween(0.7, 1.1));
    }
  }

  createBorderDecorations() {
    const borderWidth = 64;
    const tileSize = 32;

    for (let x = 0; x < this.width; x += tileSize) {
      for (let offset = 0; offset < borderWidth; offset += tileSize) {
        if (Phaser.Math.Between(0, 3) === 0) {
          this.scene.add.image(x + tileSize / 2, offset + tileSize / 2, "rock")
            .setDepth(2).setScale(0.5).setAlpha(0.5);
        }
        if (Phaser.Math.Between(0, 3) === 0) {
          this.scene.add.image(x + tileSize / 2, this.height - offset - tileSize / 2, "rock")
            .setDepth(2).setScale(0.5).setAlpha(0.5);
        }
      }
    }

    for (let y = 0; y < this.height; y += tileSize) {
      for (let offset = 0; offset < borderWidth; offset += tileSize) {
        if (Phaser.Math.Between(0, 3) === 0) {
          this.scene.add.image(offset + tileSize / 2, y + tileSize / 2, "rock")
            .setDepth(2).setScale(0.5).setAlpha(0.5);
        }
        if (Phaser.Math.Between(0, 3) === 0) {
          this.scene.add.image(this.width - offset - tileSize / 2, y + tileSize / 2, "rock")
            .setDepth(2).setScale(0.5).setAlpha(0.5);
        }
      }
    }
  }

  isTooCloseToCenter(x, y, minDist) {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    return Phaser.Math.Distance.Between(x, y, centerX, centerY) < minDist;
  }

  isInWater(x, y) {
    const tileSize = 32;
    const tileKey = `${Math.floor(x / tileSize)},${Math.floor(y / tileSize)}`;
    return this.waterTiles.has(tileKey);
  }
}

export default World;
