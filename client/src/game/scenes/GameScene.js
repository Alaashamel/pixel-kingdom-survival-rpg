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
import ShopSystem from "../systems/ShopSystem";
import ShopUI from "../ui/ShopUI";
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

    this.playSound = (method) => {
      if (this.game.audioSystem) {
        try { this.game.audioSystem[method](); } catch { /* ignore */ }
      }
    };

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
      this.playSound("playLevelUp");
    };
    this.player.onDeath = () => {
      this.playSound("playDeath");
    };

    this.enemyGroup = this.physics.add.group();
    this.wave = 1;
    this.spawnWave();

    this.physics.add.collider(this.player, this.worldSystem.treeGroup);
    this.physics.add.collider(this.player, this.worldSystem.rockGroup);
    this.physics.add.collider(this.enemyGroup, this.worldSystem.treeGroup);
    this.physics.add.collider(this.enemyGroup, this.worldSystem.rockGroup);
    this.physics.add.collider(this.enemyGroup, this.enemyGroup);

    this.cameras.main.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.roundPixels = true;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.rangedKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.whirlwindKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.inventoryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    this._lastShiftTime = 0;
    this._dashCooldown = false;

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
        gold: this.player.gold,
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
      this.game.questSystem.onRewardGranted = (reward) => {
        if (reward.gold) this.player.gold += reward.gold;
        if (reward.xp) this.player.gainXP(reward.xp);
      };
    }
    this.questUI = new QuestUI(this, this.game.questSystem);
    this.questUI.createTracker();

    this.shopSystem = new ShopSystem(this);
    this.shopUI = new ShopUI(this, this.shopSystem);

    this.isPaused = false;
    this.input.keyboard.on("keydown-ESC", () => {
      if (this.shopUI.isOpen) {
        this.shopUI.close();
      } else if (this.skillTreeUI.isOpen) {
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

    this.shopKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.input.keyboard.on("keydown-B", () => {
      if (!this.isPaused && !this.saveLoadUI.isOpen && !this.skillTreeUI.isOpen && !this.inventoryPanel.isOpen && !this.questUI.isLogOpen) {
        if (this.shopUI.isOpen) {
          this.shopUI.close();
        } else if (this.isNearShopkeeper()) {
          this.shopUI.open();
        }
      }
    });

    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.audioStarted = false;
    const startAudio = () => {
      if (!this.audioStarted && this.game.audioSystem) {
        this.game.audioSystem.resume();
        this.game.audioSystem.startMusic();
        this.audioStarted = true;
      }
    };
    this.input.once("pointerdown", startAudio);
    this.input.keyboard.once("keydown", startAudio);
  }

  getWaveConfigs() {
    const scale = 1 + (this.wave - 1) * 0.15;
    const configs = [
      { type: "slime", texture: "slime", health: Math.floor(80 * scale), speed: 80 + this.wave * 5, damage: Math.floor(10 * scale), xpReward: 20 + this.wave * 2, attackCooldown: 800, count: 15 + this.wave * 2 },
      { type: "slime", texture: "slime", health: Math.floor(140 * scale), speed: 100 + this.wave * 5, damage: Math.floor(16 * scale), xpReward: 35 + this.wave * 3, attackCooldown: 700, count: 8 + this.wave },
      { type: "slime", texture: "slime", health: Math.floor(220 * scale), speed: 120 + this.wave * 5, damage: Math.floor(24 * scale), xpReward: 50 + this.wave * 4, attackCooldown: 600, count: 4 + Math.floor(this.wave / 2) },
    ];

    if (this.wave >= 2) {
      configs.push({ type: "skeleton", texture: "skeleton", health: Math.floor(280 * scale), speed: 70 + this.wave * 4, damage: Math.floor(20 * scale), xpReward: 45 + this.wave * 3, attackCooldown: 900, count: 3 + this.wave });
    }

    if (this.wave >= 3) {
      configs.push({ type: "archer", texture: "archer", health: Math.floor(100 * scale), speed: 90 + this.wave * 3, damage: Math.floor(14 * scale), xpReward: 40 + this.wave * 3, attackCooldown: 1500, count: 2 + Math.floor(this.wave / 2), isRanged: true, preferredDistance: 160 });
    }

    if (this.wave >= 4) {
      configs.push({ type: "mage", texture: "mage", health: Math.floor(80 * scale), speed: 60 + this.wave * 2, damage: Math.floor(22 * scale), xpReward: 55 + this.wave * 4, attackCooldown: 2000, count: 1 + Math.floor(this.wave / 3), isRanged: true, preferredDistance: 200 });
    }

    return configs;
  }

  spawnWave() {
    const enemyConfigs = this.getWaveConfigs();
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

    if (this.wave === 1) {
      this.spawnBoss();
    }

    this.showWaveAnnouncement();
  }

  showWaveAnnouncement() {
    const { width, height } = this.cameras.main;
    const text = this.add.text(width / 2, height * 0.35, `WAVE ${this.wave}`, {
      fontSize: "40px",
      fill: "#ff6600",
      fontFamily: "monospace",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    });
    text.setOrigin(0.5);
    text.setScrollFactor(0);
    text.setDepth(300);
    text.setAlpha(0);

    const subtext = this.add.text(width / 2, height * 0.35 + 40, `${this.getAliveEnemyCount()} enemies incoming`, {
      fontSize: "16px",
      fill: "#ffffff",
      fontFamily: "monospace",
      stroke: "#000000",
      strokeThickness: 2,
    });
    subtext.setOrigin(0.5);
    subtext.setScrollFactor(0);
    subtext.setDepth(300);
    subtext.setAlpha(0);

    this.tweens.add({
      targets: [text, subtext],
      alpha: 1,
      duration: 400,
      ease: "Power2",
      onComplete: () => {
        this.tweens.add({
          targets: [text, subtext],
          alpha: 0,
          duration: 600,
          delay: 1500,
          ease: "Power2",
          onComplete: () => { text.destroy(); subtext.destroy(); },
        });
      },
    });

    this.cameras.main.flash(200, 255, 102, 0, true);
  }

  getAliveEnemyCount() {
    return this.enemyGroup.getChildren().filter((e) => e && e.isAlive).length;
  }

  checkWaveComplete() {
    if (this.getAliveEnemyCount() === 0 && !this.wavePending) {
      this.wavePending = true;
      this.time.delayedCall(3000, () => {
        this.wave++;
        this.spawnWave();
        this.wavePending = false;
      });
    }
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
    this.playSound("playDamage");
    this.combatSystem.knockback(player, boss, 200);
  }

  performAttack() {
    if (!this.player.attack()) return;

    this.playSound("playAttack");

    const nearestEnemy = this.findNearestEnemy();

    if (nearestEnemy) {
      const angle = Phaser.Math.Angle.Between(
        this.player.x, this.player.y, nearestEnemy.x, nearestEnemy.y
      );
      if (angle > -0.75 && angle < 0.75) this.player.facing = "right";
      else if (angle > 0.75 && angle < 2.35) this.player.facing = "down";
      else if (angle < -0.75 && angle > -2.35) this.player.facing = "up";
      else this.player.facing = "left";
      this.player.updateFacing();
    }

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

    [...this.enemyGroup.getChildren()].forEach((enemy) => {
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
          this.playSound("playCriticalHit");
          this.cameras.main.shake(50, 0.005);
          this.particleSystem.screenFlash(0xff0000, 150);
        } else {
          this.playSound("playHit");
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
          this.playSound("playCriticalHit");
          this.cameras.main.shake(80, 0.01);
        } else {
          this.playSound("playHit");
        }
        this.combatSystem.showDamageNumber(this.boss.x, this.boss.y, dmg, isCrit);
      }
    }

    this.player.isAttacking = true;
    this.time.delayedCall(150, () => {
      this.player.isAttacking = false;
    });
  }

  findNearestEnemy() {
    let nearest = null;
    let minDist = this.player.attackRange * 2;
    this.enemyGroup.getChildren().forEach((enemy) => {
      if (!enemy.isAlive) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, enemy.x, enemy.y
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    });
    return nearest;
  }

  performRangedAttack() {
    if (!this.player.isAlive) return;
    if (this.player.mana < 5) return;

    const now = this.time.now;
    if (!this._lastRangedTime) this._lastRangedTime = 0;
    if (now - this._lastRangedTime < 400) return;

    this._lastRangedTime = now;
    this.player.mana -= 5;

    const facingToAngle = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
    const angle = facingToAngle[this.player.facing] || 0;

    const proj = this.add.circle(this.player.x, this.player.y, 5, 0x42a5f5);
    proj.setDepth(9);
    this.physics.add.existing(proj);
    proj.body.setAllowGravity(false);

    const speed = 350;
    proj.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    this.playSound("playAttack");

    this.tweens.add({
      targets: proj,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
    });

    this.time.delayedCall(1500, () => {
      if (proj.active) proj.destroy();
    });

    [...this.enemyGroup.getChildren()].forEach((enemy) => {
      if (!enemy || !enemy.isAlive) return;
      this.physics.add.overlap(proj, enemy, () => {
        if (!proj.active || !enemy.isAlive) return;
        if (proj.body) proj.body.enable = false;

        const isCritical = Math.random() < (this.player.critChance || 0.15);
        const damage = isCritical
          ? Math.floor(this.player.attackDamage * 0.7 * 1.8)
          : Math.floor(this.player.attackDamage * 0.7);

        enemy.takeDamage(damage);
        this.combatSystem.knockback(enemy, this.player, 150);
        this.particleSystem.emitDamageParticles(enemy.x, enemy.y, damage, isCritical);

        if (isCritical) {
          this.playSound("playCriticalHit");
        } else {
          this.playSound("playHit");
        }

        proj.destroy();
      });
    });

    if (this.boss && this.boss.isAlive) {
      this.physics.add.overlap(proj, this.boss, () => {
        if (!proj.active || !this.boss.isAlive) return;
        if (proj.body) proj.body.enable = false;

        const dmg = Math.floor(this.player.attackDamage * 0.7);
        this.boss.takeDamage(dmg);
        this.combatSystem.showDamageNumber(this.boss.x, this.boss.y, dmg, false);
        this.playSound("playHit");
        proj.destroy();
      });
    }
  }

  isNearShopkeeper() {
    if (!this.worldSystem || !this.worldSystem.shopkeeperX) return false;
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.worldSystem.shopkeeperX, this.worldSystem.shopkeeperY
    );
    return dist < 80;
  }

  performWhirlwind() {
    if (!this.player.isAlive) return;
    if (this.player.mana < 10) return;

    const now = this.time.now;
    if (this._lastWhirlwindTime && now - this._lastWhirlwindTime < 2000) return;
    this._lastWhirlwindTime = now;
    this.player.mana -= 10;

    this.playSound("playAttack");

    const whirlRadius = 120;
    const spin = this.add.circle(this.player.x, this.player.y, whirlRadius, 0xffffff, 0.3);
    spin.setDepth(11);
    spin.setStrokeStyle(3, 0xffee58);

    this.tweens.add({
      targets: spin,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 400,
      onComplete: () => spin.destroy(),
    });

    this.tweens.add({
      targets: this.player,
      angle: 360,
      duration: 300,
      onComplete: () => { this.player.angle = 0; },
    });

    [...this.enemyGroup.getChildren()].forEach((enemy) => {
      if (!enemy || !enemy.isAlive) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, enemy.x, enemy.y
      );
      if (dist < whirlRadius + 20) {
        const isCritical = Math.random() < (this.player.critChance || 0.15);
        const damage = isCritical
          ? Math.floor(this.player.attackDamage * 1.2 * 1.8)
          : Math.floor(this.player.attackDamage * 1.2);

        enemy.takeDamage(damage);
        this.combatSystem.knockback(enemy, this.player, 200);
        this.particleSystem.emitDamageParticles(enemy.x, enemy.y, damage, isCritical);

        if (isCritical) {
          this.playSound("playCriticalHit");
        } else {
          this.playSound("playHit");
        }
      }
    });

    if (this.boss && this.boss.isAlive) {
      const bossDist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, this.boss.x, this.boss.y
      );
      if (bossDist < whirlRadius + 30) {
        const dmg = Math.floor(this.player.attackDamage * 1.2);
        this.boss.takeDamage(dmg);
        this.combatSystem.showDamageNumber(this.boss.x, this.boss.y, dmg, false);
        this.playSound("playHit");
      }
    }
  }

  performDash() {
    if (!this.player.isAlive) return;
    if (this._dashCooldown) return;

    this._dashCooldown = true;
    this.time.delayedCall(800, () => { this._dashCooldown = false; });

    const facingToAngle = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
    const angle = facingToAngle[this.player.facing] || 0;
    const dashDist = 180;

    const targetX = this.player.x + Math.cos(angle) * dashDist;
    const targetY = this.player.y + Math.sin(angle) * dashDist;

    this.tweens.add({
      targets: this.player,
      x: targetX,
      y: targetY,
      duration: 150,
      ease: "Power2",
      onStart: () => {
        this.player.body.enable = false;
        this.player.setAlpha(0.5);
      },
      onComplete: () => {
        this.player.body.enable = true;
        this.player.setAlpha(1);
        this.player.body.reset(targetX, targetY);
      },
    });

    this.particleSystem.emitAttackParticles(this.player.x, this.player.y, this.player.facing);
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

    this.waveText = this.add.text(this.cameras.main.width - 16, 36, "Wave 1", {
      fontSize: "12px",
      fill: "#ff9900",
      fontFamily: "monospace",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.waveText.setOrigin(1, 0);
    this.waveText.setScrollFactor(0);
    this.waveText.setDepth(100);

    this.enemyCountText = this.add.text(this.cameras.main.width - 16, 52, "Enemies: 0", {
      fontSize: "12px",
      fill: "#ff6666",
      fontFamily: "monospace",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.enemyCountText.setOrigin(1, 0);
    this.enemyCountText.setScrollFactor(0);
    this.enemyCountText.setDepth(100);

    this.goldText = this.add.text(this.cameras.main.width - 16, 68, "Gold: 50", {
      fontSize: "12px",
      fill: "#ffd700",
      fontFamily: "monospace",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.goldText.setOrigin(1, 0);
    this.goldText.setScrollFactor(0);
    this.goldText.setDepth(100);

    this.shopHint = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 16, "", {
      fontSize: "12px",
      fill: "#ffd700",
      fontFamily: "monospace",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.shopHint.setOrigin(0.5, 1);
    this.shopHint.setScrollFactor(0);
    this.shopHint.setDepth(100);

    const controlsText = this.add.text(16, this.cameras.main.height - 16, "WASD: Move | SPACE: Melee | E: Ranged | Q: Whirlwind | SHIFT: Dash | B: Shop | I: Inventory | ESC: Pause", {
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

    if (!this.player.isAlive) {
      [...this.enemyGroup.getChildren()].forEach((enemy) => {
        if (enemy && enemy.isAlive && enemy.body && enemy.body.enable) {
          enemy.body.setVelocity(0, 0);
          enemy.updateHealthBar();
        }
      });
      this.updateHUD();
      return;
    }

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

    if (Phaser.Input.Keyboard.JustDown(this.rangedKey)) {
      this.performRangedAttack();
    }

    if (Phaser.Input.Keyboard.JustDown(this.whirlwindKey) && this.game.skillTree?.hasSkill("whirlwind")) {
      this.performWhirlwind();
    }

    if (this.game.skillTree?.hasSkill("dash") && Phaser.Input.Keyboard.JustDown(this.cursors.shift)) {
      this.performDash();
    }

    const enemies = [...this.enemyGroup.getChildren()];
    enemies.forEach((enemy) => {
      if (!enemy || !enemy.isAlive || !enemy.body || !enemy.body.enable) return;
      enemy.chaseTarget(this.player);
      enemy.updateHealthBar();

      const dist = Phaser.Math.Distance.Between(
        enemy.x, enemy.y, this.player.x, this.player.y
      );
      if (dist < 28 && !enemy.isRanged) {
        const now = this.time.now;
        if (!enemy.lastAttackTime || now - enemy.lastAttackTime >= enemy.attackCooldown) {
          enemy.lastAttackTime = now;
          enemy.dealDamage(this.player);
          this.playSound("playDamage");

          this.tweens.add({
            targets: enemy,
            scaleX: 1.3,
            scaleY: 0.7,
            duration: 80,
            yoyo: true,
          });

          this.combatSystem.knockback(this.player, enemy, 120);
        }
      }
    });

    this.player.updateRegen(this.game.loop.delta);

    this.weatherSystem.update(this.time.now);
    this.minimap.update(this.player, this.enemyGroup);
    this.updateHUD();
    this.checkWaveComplete();
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
    if (this.player.xpToNextLevel > 0) {
      this.xpBar.fill.width = maxBarWidth * Math.max(0, this.player.xp / this.player.xpToNextLevel);
    }

    this.levelText.setText(`Lv. ${this.player.level}`);
    this.waveText.setText(`Wave ${this.wave}`);

    const aliveEnemies = this.getAliveEnemyCount();
    this.enemyCountText.setText(`Enemies: ${aliveEnemies}`);

    this.goldText.setText(`Gold: ${this.player.gold}`);

    if (this.isNearShopkeeper() && !this.shopUI.isOpen) {
      this.shopHint.setText("Press B to open Shop");
    } else {
      this.shopHint.setText("");
    }
  }
}
