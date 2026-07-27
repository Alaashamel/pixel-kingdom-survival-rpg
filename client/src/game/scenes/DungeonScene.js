import Phaser from "phaser";
import Player from "../entities/Player";
import Enemy from "../entities/Enemy";
import CombatSystem from "../systems/CombatSystem";
import ParticleSystem from "../systems/ParticleSystem";
import { COLORS } from "../constants.js";

const ROOM_W = 800;
const ROOM_H = 600;
const TILE = 32;

export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super("DungeonScene");
  }

  init(data) {
    this.playerData = data.playerData || {};
    this.overworldWave = data.wave || 1;
  }

  create() {
    this.combatSystem = new CombatSystem(this);
    this.particleSystem = new ParticleSystem(this);

    this.physics.world.setBounds(0, 0, ROOM_W, ROOM_H);
    this.physics.world.gravity.y = 0;

    this.createRoom();
    this.createPlayer();
    this.spawnDungeonEnemies();
    this.createExitPortal();
    this.createHUD();
    this.setupInput();

    this.cameras.main.setBounds(0, 0, ROOM_W, ROOM_H);
    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.playSound = (method) => {
      if (this.game.audioSystem) {
        try { this.game.audioSystem[method](); } catch { /* ignore */ }
      }
    };
  }

  createRoom() {
    for (let x = 0; x < ROOM_W; x += TILE) {
      for (let y = 0; y < ROOM_H; y += TILE) {
        const g = this.add.rectangle(x + TILE / 2, y + TILE / 2, TILE, TILE, 0x2a2a3a);
        g.setDepth(0);
      }
    }

    const wallColor = 0x4a4a5a;
    const wallDepth = 5;

    for (let x = 0; x < ROOM_W; x += TILE) {
      const topWall = this.physics.add.staticImage(x + TILE / 2, TILE / 2, "rock");
      topWall.setDisplaySize(TILE, TILE);
      topWall.setTint(wallColor);
      topWall.setDepth(wallDepth);

      const botWall = this.physics.add.staticImage(x + TILE / 2, ROOM_H - TILE / 2, "rock");
      botWall.setDisplaySize(TILE, TILE);
      botWall.setTint(wallColor);
      botWall.setDepth(wallDepth);
    }

    for (let y = 0; y < ROOM_H; y += TILE) {
      const leftWall = this.physics.add.staticImage(TILE / 2, y + TILE / 2, "rock");
      leftWall.setDisplaySize(TILE, TILE);
      leftWall.setTint(wallColor);
      leftWall.setDepth(wallDepth);

      const rightWall = this.physics.add.staticImage(ROOM_W - TILE / 2, y + TILE / 2, "rock");
      rightWall.setDisplaySize(TILE, TILE);
      rightWall.setTint(wallColor);
      rightWall.setDepth(wallDepth);
    }

    for (let i = 0; i < 8; i++) {
      const tx = Phaser.Math.Between(TILE * 2, ROOM_W - TILE * 2);
      const ty = Phaser.Math.Between(TILE * 2, ROOM_H - TILE * 2);
      const torch = this.add.circle(tx, ty, 4, 0xff6600, 0.9);
      torch.setDepth(6);

      this.tweens.add({
        targets: torch,
        alpha: 0.4,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    const title = this.add.text(ROOM_W / 2, 50, "DUNGEON", {
      fontSize: "20px", fill: "#ff6600", fontFamily: "monospace", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 3,
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(100);
  }

  createPlayer() {
    this.player = new Player(this, ROOM_W / 2, ROOM_H - TILE * 3);

    const pd = this.playerData;
    if (pd.health) this.player.health = pd.health;
    if (pd.maxHealth) this.player.maxHealth = pd.maxHealth;
    if (pd.mana) this.player.mana = pd.mana;
    if (pd.maxMana) this.player.maxMana = pd.maxMana;
    if (pd.attackDamage) this.player.attackDamage = pd.attackDamage;
    if (pd.level) this.player.level = pd.level;
    if (pd.critChance) this.player.critChance = pd.critChance;
    if (pd.damageReduction) this.player.damageReduction = pd.damageReduction;
    if (pd.gold !== undefined) this.player.gold = pd.gold;

    this.player.onDeath = () => {
      this.time.delayedCall(2000, () => {
        this.scene.start("GameScene", { returnFromDungeon: true, wave: this.overworldWave });
      });
    };
  }

  spawnDungeonEnemies() {
    this.enemyGroup = this.physics.add.group();
    const scale = 1 + (this.overworldWave - 1) * 0.15;

    const enemyConfigs = [
      { type: "skeleton", texture: "skeleton", count: 4 + this.overworldWave, health: Math.floor(200 * scale), speed: 90 + this.overworldWave * 5, damage: Math.floor(18 * scale), xpReward: 40, attackCooldown: 800 },
      { type: "archer", texture: "archer", count: 2 + Math.floor(this.overworldWave / 2), health: Math.floor(120 * scale), speed: 80, damage: Math.floor(16 * scale), xpReward: 45, attackCooldown: 1400, isRanged: true, preferredDistance: 150 },
      { type: "mage", texture: "mage", count: 1 + Math.floor(this.overworldWave / 2), health: Math.floor(90 * scale), speed: 60, damage: Math.floor(24 * scale), xpReward: 55, attackCooldown: 1800, isRanged: true, preferredDistance: 180 },
    ];

    enemyConfigs.forEach((config) => {
      for (let i = 0; i < config.count; i++) {
        const x = Phaser.Math.Between(TILE * 3, ROOM_W - TILE * 3);
        const y = Phaser.Math.Between(TILE * 3, ROOM_H / 2);

        const enemy = new Enemy(this, x, y, config.texture, {
          health: config.health,
          speed: config.speed,
          damage: config.damage,
          xpReward: config.xpReward,
          attackCooldown: config.attackCooldown,
          enemyType: config.type,
          isRanged: config.isRanged || false,
          preferredDistance: config.preferredDistance || 150,
        });

        this.enemyGroup.add(enemy);
      }
    });

    const bossScale = scale * 1.5;
    const bossX = ROOM_W / 2;
    const bossY = ROOM_H / 3;
    this.dungeonBoss = new Enemy(this, bossX, bossY, "skeleton", {
      health: Math.floor(600 * bossScale),
      speed: 100,
      damage: Math.floor(30 * bossScale),
      xpReward: 200,
      attackCooldown: 1200,
      enemyType: "boss_skeleton",
    });
    this.dungeonBoss.setScale(2);
    this.dungeonBoss.setTint(0xff4444);
    this.enemyGroup.add(this.dungeonBoss);

    this.dungeonChest = null;
  }

  createExitPortal() {
    this.exitPortal = this.add.circle(ROOM_W / 2, ROOM_H - TILE * 2, 16, 0x42a5f5, 0.6);
    this.exitPortal.setDepth(5);
    this.exitPortal.setStrokeStyle(2, 0x90caf9);

    this.tweens.add({
      targets: this.exitPortal,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const exitLabel = this.add.text(ROOM_W / 2, ROOM_H - TILE * 2 - 25, "EXIT", {
      fontSize: "10px", fill: "#42a5f5", fontFamily: "monospace", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 2,
    });
    exitLabel.setOrigin(0.5);
    exitLabel.setDepth(10);
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
        fontSize: "10px", fill: "#ffffff", fontFamily: "monospace",
      });
      text.setOrigin(0, 0);
      return { bg, fill, text };
    };

    this.healthBar = createBar(16, COLORS.HEALTH_BAR, "HP");
    this.manaBar = createBar(16 + barGap, COLORS.MANA_BAR, "MP");
    this.staminaBar = createBar(16 + barGap * 2, COLORS.STAMINA_BAR, "SP");

    hudContainer.add([
      this.healthBar.bg, this.healthBar.fill, this.healthBar.text,
      this.manaBar.bg, this.manaBar.fill, this.manaBar.text,
      this.staminaBar.bg, this.staminaBar.fill, this.staminaBar.text,
    ]);

    this.dungeonInfo = this.add.text(ROOM_W - 16, 16, "Dungeon", {
      fontSize: "14px", fill: "#ff6600", fontFamily: "monospace", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 2,
    });
    this.dungeonInfo.setOrigin(1, 0);
    this.dungeonInfo.setScrollFactor(0);
    this.dungeonInfo.setDepth(100);

    this.enemyCountText = this.add.text(ROOM_W - 16, 34, "Enemies: 0", {
      fontSize: "11px", fill: "#ff6666", fontFamily: "monospace",
      stroke: "#000000", strokeThickness: 2,
    });
    this.enemyCountText.setOrigin(1, 0);
    this.enemyCountText.setScrollFactor(0);
    this.enemyCountText.setDepth(100);
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.rangedKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("GameScene", { returnFromDungeon: true, wave: this.overworldWave });
    });
  }

  getAliveEnemyCount() {
    return this.enemyGroup.getChildren().filter((e) => e && e.isAlive).length;
  }

  performAttack() {
    if (!this.player.attack()) return;
    this.playSound("playAttack");

    this.combatSystem.createAttackEffect(this.player.x, this.player.y, this.player.facing);

    const hitbox = this.combatSystem.getAttackHitbox(
      this.player.x, this.player.y, this.player.facing, this.player.attackRange
    );

    [...this.enemyGroup.getChildren()].forEach((enemy) => {
      if (!enemy.isAlive) return;
      const dist = Phaser.Math.Distance.Between(hitbox.x, hitbox.y, enemy.x, enemy.y);
      if (dist < hitbox.radius + 12) {
        const isCritical = Math.random() < (this.player.critChance || 0.15);
        const damage = isCritical
          ? Math.floor(this.player.attackDamage * 1.8)
          : this.player.attackDamage;
        enemy.takeDamage(damage);
        this.combatSystem.knockback(enemy, this.player, 180);
        this.particleSystem.emitDamageParticles(enemy.x, enemy.y, damage, isCritical);
        if (isCritical) this.playSound("playCriticalHit");
        else this.playSound("playHit");
      }
    });
  }

  performRangedAttack() {
    if (!this.player.isAlive || this.player.mana < 5) return;
    const now = this.time.now;
    if (this._lastRangedTime && now - this._lastRangedTime < 400) return;
    this._lastRangedTime = now;
    this.player.mana -= 5;

    const facingToAngle = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
    const angle = facingToAngle[this.player.facing] || 0;

    const proj = this.add.circle(this.player.x, this.player.y, 5, 0x42a5f5);
    proj.setDepth(9);
    this.physics.add.existing(proj);
    proj.body.setAllowGravity(false);
    proj.body.setVelocity(Math.cos(angle) * 350, Math.sin(angle) * 350);
    this.playSound("playAttack");

    this.time.delayedCall(1500, () => { if (proj.active) proj.destroy(); });

    [...this.enemyGroup.getChildren()].forEach((enemy) => {
      if (!enemy.isAlive) return;
      this.physics.add.overlap(proj, enemy, () => {
        if (!proj.active || !enemy.isAlive) return;
        if (proj.body) proj.body.enable = false;
        const dmg = Math.floor(this.player.attackDamage * 0.7);
        enemy.takeDamage(dmg);
        this.combatSystem.knockback(enemy, this.player, 150);
        this.playSound("playHit");
        proj.destroy();
      });
    });
  }

  spawnChest() {
    if (this.dungeonChest) return;
    this.dungeonChest = this.add.rectangle(ROOM_W / 2, ROOM_H / 2, 28, 22, 0xffd700);
    this.dungeonChest.setDepth(5);
    this.dungeonChest.setStrokeStyle(2, 0xdaa520);

    const label = this.add.text(ROOM_W / 2, ROOM_H / 2 - 22, "TREASURE", {
      fontSize: "10px", fill: "#ffd700", fontFamily: "monospace", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 2,
    });
    label.setOrigin(0.5);
    label.setDepth(10);

    this.tweens.add({
      targets: this.dungeonChest,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.physics.add.existing(this.dungeonChest, true);
    this.physics.add.overlap(this.player, this.dungeonChest, () => {
      if (!this.dungeonChest || !this.dungeonChest.active) return;
      this.player.gold += 100;
      this.player.heal(50);
      this.player.mana = this.player.maxMana;
      if (this.game.shopSystem) {
        const items = ["iron_sword", "iron_armor", "speed_boots"];
        const itemId = Phaser.Utils.Array.GetRandom(items);
        const item = this.game.shopSystem.getAvailableItems().find((i) => i.id === itemId);
        if (item) {
          const existing = this.game.shopSystem.inventory.find((i) => i.id === item.id);
          if (existing) existing.count++;
          else this.game.shopSystem.inventory.push({ ...item, count: 1 });
        }
      }
      this.playSound("playLevelUp");
      this.cameras.main.flash(300, 255, 215, 0);
      this.dungeonChest.destroy();
      this.dungeonChest = null;
      label.destroy();
    });
  }

  update() {
    if (!this.player || !this.player.isAlive) return;

    this.player.move(this.cursors, this.wasd);

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.performAttack();
    }
    if (Phaser.Input.Keyboard.JustDown(this.rangedKey)) {
      this.performRangedAttack();
    }

    [...this.enemyGroup.getChildren()].forEach((enemy) => {
      if (!enemy || !enemy.isAlive || !enemy.body || !enemy.body.enable) return;
      enemy.chaseTarget(this.player);
      enemy.updateHealthBar();

      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      if (dist < 28 && !enemy.isRanged) {
        const now = this.time.now;
        if (!enemy.lastAttackTime || now - enemy.lastAttackTime >= enemy.attackCooldown) {
          enemy.lastAttackTime = now;
          enemy.dealDamage(this.player);
          this.playSound("playDamage");
          this.combatSystem.knockback(this.player, enemy, 120);
        }
      }
    });

    this.player.updateRegen(this.game.loop.delta);
    this.updateHUD();

    const alive = this.getAliveEnemyCount();
    if (alive === 0 && !this.dungeonChest) {
      this.spawnChest();
    }

    const distToExit = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.exitPortal.x, this.exitPortal.y
    );
    if (distToExit < 30 && this.getAliveEnemyCount() === 0) {
      this.scene.start("GameScene", { returnFromDungeon: true, wave: this.overworldWave });
    }
  }

  updateHUD() {
    const maxBarWidth = 156;
    if (this.player.maxHealth > 0) {
      this.healthBar.fill.width = maxBarWidth * Math.max(0, this.player.health / this.player.maxHealth);
    }
    if (this.player.maxMana > 0) {
      this.manaBar.fill.width = maxBarWidth * Math.max(0, this.player.mana / this.player.maxMana);
    }
    if (this.player.maxStamina > 0) {
      this.staminaBar.fill.width = maxBarWidth * Math.max(0, this.player.stamina / this.player.maxStamina);
    }
    this.enemyCountText.setText(`Enemies: ${this.getAliveEnemyCount()}`);
  }
}
