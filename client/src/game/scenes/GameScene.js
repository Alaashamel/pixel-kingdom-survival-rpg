import Phaser from "phaser";
import Player from "../entities/Player";
import Enemy from "../entities/Enemy";
import Boss from "../entities/Boss";
import World from "../world/World";
import CombatSystem from "../systems/CombatSystem";
import WeatherSystem from "../systems/WeatherSystem";
import Minimap from "../ui/Minimap";
import LevelUpNotification from "../ui/LevelUpNotification";
import InventoryPanel from "../ui/InventoryPanel";
import MobileControls from "../ui/MobileControls";
import SaveSystem from "../systems/SaveSystem";
import SaveLoadUI from "../ui/SaveLoadUI";
import SkillTree from "../systems/SkillTree";
import SkillTreeUI from "../ui/SkillTreeUI";
import ParticleSystem from "../systems/ParticleSystem";
import QuestSystem from "../systems/QuestSystem";
import QuestUI from "../ui/QuestUI";
import { SCENES, COLORS, WORLD } from "../constants.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME);
  }

  create() {
    this.combatSystem = new CombatSystem(this);
    this.particleSystem = new ParticleSystem(this);
    this.weatherSystem = new WeatherSystem(this);
    this.weatherSystem.create();

    this.time.delayedCall(10000, () => {
      this.weatherSystem.startRain();
      this.time.delayedCall(15000, () => {
        this.weatherSystem.stopRain();
      });
    });

    this.worldSystem = new World(this);
    this.worldSystem.create();

    this.player = new Player(this, WORLD.WIDTH / 2, WORLD.HEIGHT / 2);
    this.player.onLevelUp = (level) => {
      this.levelUpNotification.show(level);
      this.game.audioSystem.playLevelUp();
    };
    this.player.onDeath = () => {
      this.game.audioSystem.playDeath();
    };

    this.enemyGroup = this.physics.add.group();
    this.spawnEnemies();

    this.physics.add.collider(this.player, this.worldSystem.treeGroup);
    this.physics.add.collider(this.player, this.worldSystem.rockGroup);
    this.physics.add.collider(this.enemyGroup, this.worldSystem.treeGroup);
    this.physics.add.collider(this.enemyGroup, this.worldSystem.rockGroup);
    this.physics.add.collider(this.enemyGroup, this.enemyGroup);

    this.physics.add.overlap(
      this.player,
      this.enemyGroup,
      this.handlePlayerEnemyOverlap,
      null,
      this
    );

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

    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.inventoryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    this.createHUD();

    this.minimap = new Minimap(this);
    this.levelUpNotification = new LevelUpNotification(this);
    this.inventoryPanel = new InventoryPanel(this);
    this.mobileControls = new MobileControls(this);

    if (!this.game.saveSystem) {
      this.game.saveSystem = new SaveSystem();
    }
    this.saveLoadUI = new SaveLoadUI(this, this.game.saveSystem);

    this.game.saveSystem.startAutoSave(
      () => ({
        health: this.player.health,
        maxHealth: this.player.maxHealth,
        mana: this.player.mana,
        maxMana: this.player.maxMana,
        stamina: this.player.stamina,
        maxStamina: this.player.maxStamina,
        level: this.player.level,
        xp: this.player.xp,
        xpToNextLevel: this.player.xpToNextLevel,
        attackDamage: this.player.attackDamage,
        x: this.player.x,
        y: this.player.y,
      }),
      () => ({}),
      0
    );

    if (!this.game.skillTree) {
      this.game.skillTree = new SkillTree();
    }
    this.skillTreeUI = new SkillTreeUI(this, this.game.skillTree);

    if (!this.game.questSystem) {
      this.game.questSystem = new QuestSystem();
      this.game.questSystem.acceptQuest("firstSteps");
      this.game.questSystem.acceptQuest("survivor");
      this.game.questSystem.acceptQuest("collector");
    }
    this.questUI = new QuestUI(this, this.game.questSystem);
    this.questUI.createTracker();

    this.isPaused = false;
    this.input.keyboard.on("keydown-ESC", () => {
      if (this.skillTreeUI.isOpen) {
        this.skillTreeUI.close();
      } else if (this.saveLoadUI.isOpen) {
        this.saveLoadUI.close();
      } else if (this.inventoryPanel.isOpen) {
        this.inventoryPanel.close();
      } else {
        this.togglePause();
      }
    });

    this.input.keyboard.on("keydown-I", () => {
      if (!this.isPaused && !this.saveLoadUI.isOpen && !this.skillTreeUI.isOpen) {
        this.inventoryPanel.toggle();
      }
    });

    this.input.keyboard.on("keydown-T", () => {
      if (!this.isPaused && !this.saveLoadUI.isOpen && !this.inventoryPanel.isOpen && !this.questUI.isLogOpen) {
        if (this.skillTreeUI.isOpen) {
          this.skillTreeUI.close();
        } else {
          this.skillTreeUI.open();
        }
      }
    });

    this.input.keyboard.on("keydown-L", () => {
      if (!this.isPaused && !this.saveLoadUI.isOpen && !this.inventoryPanel.isOpen && !this.skillTreeUI.isOpen) {
        if (this.questUI.isLogOpen) {
          this.questUI.closeLog();
        } else {
          this.questUI.openLog();
        }
      }
    });

    this.input.keyboard.on("keydown-F5", () => {
      if (!this.isPaused) {
        this.saveLoadUI.open();
      }
    });

    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.game.audioSystem.startMusic();
  }

  spawnEnemies() {
    const enemyConfigs = [
      { health: 40, speed: 60, damage: 8, xpReward: 20, count: 15 },
      { health: 70, speed: 80, damage: 12, xpReward: 35, count: 8 },
      { health: 100, speed: 100, damage: 18, xpReward: 50, count: 4 },
    ];

    const margin = 300;
    const centerX = WORLD.WIDTH / 2;
    const centerY = WORLD.HEIGHT / 2;
    const safeZone = 400;

    enemyConfigs.forEach((config) => {
      for (let i = 0; i < config.count; i++) {
        let x, y;
        let attempts = 0;

        do {
          x = Phaser.Math.Between(margin, WORLD.WIDTH - margin);
          y = Phaser.Math.Between(margin, WORLD.HEIGHT - margin);
          attempts++;
        } while (
          attempts < 50 &&
          Phaser.Math.Distance.Between(x, y, centerX, centerY) < safeZone
        );

        const enemy = new Enemy(this, x, y, "slime", {
          health: config.health,
          speed: config.speed,
          damage: config.damage,
          xpReward: config.xpReward,
        });

        this.enemyGroup.add(enemy);
      }
    });

    this.spawnBoss();
  }

  spawnBoss() {
    const bossX = 500;
    const bossY = 500;
    this.boss = new Boss(this, bossX, bossY);

    this.physics.add.overlap(
      this.player,
      this.boss,
      this.handlePlayerBossOverlap,
      null,
      this
    );
  }

  handlePlayerBossOverlap(player, boss) {
    if (!boss.isAlive) return;

    const now = this.time.now;
    if (boss.lastAttackTime && now - boss.lastAttackTime < boss.attackCooldown) return;

    boss.lastAttackTime = now;
    player.takeDamage(boss.attackDamage);
    this.game.audioSystem.playDamage();
    this.combatSystem.knockback(player, boss, 200);
  }

  handlePlayerEnemyOverlap(player, enemy) {
    if (!enemy.isAlive) return;

    const now = this.time.now;
    if (enemy.lastAttackTime && now - enemy.lastAttackTime < enemy.attackCooldown) return;

    enemy.lastAttackTime = now;
    enemy.dealDamage(player);
    this.game.audioSystem.playDamage();

    this.combatSystem.knockback(player, enemy, 150);
  }

  performAttack() {
    if (!this.player.attack()) return;

    this.game.audioSystem.playAttack();

    this.combatSystem.createAttackEffect(
      this.player.x,
      this.player.y,
      this.player.facing
    );
    this.particleSystem.emitAttackParticles(
      this.player.x,
      this.player.y,
      this.player.facing
    );

    const hitbox = this.combatSystem.getAttackHitbox(
      this.player.x,
      this.player.y,
      this.player.facing,
      this.player.attackRange
    );

    this.enemyGroup.getChildren().forEach((enemy) => {
      if (!enemy.isAlive) return;

      const dist = Phaser.Math.Distance.Between(
        hitbox.x, hitbox.y,
        enemy.x, enemy.y
      );

      if (dist < hitbox.radius + 12) {
        const isCritical = Math.random() < 0.15;
        const damage = isCritical
          ? Math.floor(this.player.attackDamage * 1.8)
          : this.player.attackDamage;

        enemy.takeDamage(damage);
        this.combatSystem.knockback(enemy, this.player, 180);
        this.particleSystem.emitDamageParticles(enemy.x, enemy.y, damage, isCritical);

        if (isCritical) {
          this.game.audioSystem.playCriticalHit();
          this.cameras.main.shake(50, 0.005);
          this.particleSystem.screenFlash(0xff0000, 150);
        } else {
          this.game.audioSystem.playHit();
        }
      }
    });

    if (this.boss && this.boss.isAlive) {
      const bossDist = Phaser.Math.Distance.Between(
        hitbox.x, hitbox.y, this.boss.x, this.boss.y
      );
      if (bossDist < hitbox.radius + 20) {
        const isCrit = Math.random() < (this.player.critChance || 0.15);
        const dmg = isCrit ? Math.floor(this.player.attackDamage * 1.8) : this.player.attackDamage;
        this.boss.takeDamage(dmg);
        this.combatSystem.knockback(this.boss, this.player, 200);
        if (isCrit) {
          this.game.audioSystem.playCriticalHit();
          this.cameras.main.shake(80, 0.01);
        } else {
          this.game.audioSystem.playHit();
        }
        this.combatSystem.showDamageNumber(this.boss.x, this.boss.y, dmg, isCrit);
      }
    }

    this.player.isAttacking = true;
    this.time.delayedCall(200, () => {
      this.player.isAttacking = false;
    });
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
      this.healthBar.bg, this.healthBar.fill, this.healthBar.text,
      this.manaBar.bg, this.manaBar.fill, this.manaBar.text,
      this.staminaBar.bg, this.staminaBar.fill, this.staminaBar.text,
      this.xpBar.bg, this.xpBar.fill, this.xpBar.text,
    ]);

    this.levelText = this.add.text(this.cameras.main.width - 16, 16, "Lv. 1", {
      fontSize: "16px",
      fill: "#00e676",
      fontFamily: "monospace",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    });
    this.levelText.setOrigin(1, 0);
    this.levelText.setScrollFactor(0);
    this.levelText.setDepth(100);

    this.enemyCountText = this.add.text(this.cameras.main.width - 16, 36, "Enemies: 27", {
      fontSize: "12px",
      fill: "#ff6666",
      fontFamily: "monospace",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.enemyCountText.setOrigin(1, 0);
    this.enemyCountText.setScrollFactor(0);
    this.enemyCountText.setDepth(100);

    const controlsText = this.add.text(16, this.cameras.main.height - 16, "WASD: Move | SPACE: Attack | SHIFT: Sprint | I: Inventory | ESC: Pause", {
      fontSize: "10px",
      fill: "#888888",
      fontFamily: "monospace",
    });
    controlsText.setOrigin(0, 1);
    controlsText.setScrollFactor(0);
    controlsText.setDepth(100);
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

      this.pauseText = this.add.text(width / 2, height / 2 - 20, "PAUSED", {
        fontSize: "48px",
        fill: "#ffffff",
        fontFamily: "monospace",
      });
      this.pauseText.setOrigin(0.5);
      this.pauseText.setScrollFactor(0);
      this.pauseText.setDepth(201);

      this.pauseHint = this.add.text(width / 2, height / 2 + 30, "Press ESC to resume", {
        fontSize: "14px",
        fill: "#888888",
        fontFamily: "monospace",
      });
      this.pauseHint.setOrigin(0.5);
      this.pauseHint.setScrollFactor(0);
      this.pauseHint.setDepth(201);
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
      if (this.pauseHint) {
        this.pauseHint.destroy();
        this.pauseHint = null;
      }
    }
  }

  update() {
    if (this.isPaused) return;

    const mobileInput = this.mobileControls.getMovementInput();
    if (mobileInput && mobileInput.magnitude > 0.2) {
      this.player.body.setVelocity(
        mobileInput.x * this.player.speed,
        mobileInput.y * this.player.speed
      );
      if (mobileInput.x < -0.3) this.player.facing = "left";
      else if (mobileInput.x > 0.3) this.player.facing = "right";
      if (mobileInput.y < -0.3) this.player.facing = "up";
      else if (mobileInput.y > 0.3) this.player.facing = "down";
      this.player.updateFacing();
    } else {
      this.player.move(this.cursors, this.wasd);
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.attackKey) ||
      this.mobileControls.isAttackPressed()
    ) {
      this.performAttack();
    }

    this.enemyGroup.getChildren().forEach((enemy) => {
      if (enemy.isAlive) {
        enemy.chaseTarget(this.player);
        enemy.updateHealthBar();
      }
    });

    this.weatherSystem.update(this.time.now);
    this.minimap.update(this.player, this.enemyGroup);
    this.updateHUD();
  }

  updateHUD() {
    const maxBarWidth = 156;

    this.healthBar.fill.width = maxBarWidth * (this.player.health / this.player.maxHealth);
    this.manaBar.fill.width = maxBarWidth * (this.player.mana / this.player.maxMana);
    this.staminaBar.fill.width = maxBarWidth * (this.player.stamina / this.player.maxStamina);
    this.xpBar.fill.width = maxBarWidth * (this.player.xp / this.player.xpToNextLevel);

    this.levelText.setText(`Lv. ${this.player.level}`);

    const aliveEnemies = this.enemyGroup.getChildren().filter((e) => e.isAlive).length;
    this.enemyCountText.setText(`Enemies: ${aliveEnemies}`);
  }
}
