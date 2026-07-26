import Phaser from "phaser";
import { COLORS } from "../constants.js";

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = "slime", config = {}) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.maxHealth = config.health || 50;
    this.health = this.maxHealth;
    this.speed = config.speed || 80;
    this.damage = config.damage || 10;
    this.attackRange = config.attackRange || 40;
    this.attackCooldown = config.attackCooldown || 1000;
    this.xpReward = config.xpReward || 25;
    this.detectionRange = config.detectionRange || 200;

    this.lastAttackTime = 0;
    this.isAlive = true;
    this.isChasing = false;
    this.target = null;

    this.body.setCollideWorldBounds(true);
    this.body.setSize(24, 24);
    this.body.setOffset(4, 4);
    this.setDepth(8);

    this.healthBarBg = null;
    this.healthBarFill = null;
    this.createHealthBar();

    this.body.setBounce(0.2);
    this.body.setDrag(100);
  }

  createHealthBar() {
    const barWidth = 30;
    const barHeight = 4;

    this.healthBarBg = this.scene.add.rectangle(
      this.x, this.y - 22, barWidth, barHeight, 0x000000, 0.7
    );
    this.healthBarBg.setDepth(20);

    this.healthBarFill = this.scene.add.rectangle(
      this.x - barWidth / 2 + 1, this.y - 22, barWidth - 2, barHeight - 2, COLORS.HEALTH_BAR
    );
    this.healthBarFill.setOrigin(0, 0.5);
    this.healthBarFill.setDepth(21);
  }

  updateHealthBar() {
    if (!this.healthBarBg || !this.healthBarFill) return;

    this.healthBarBg.setPosition(this.x, this.y - 22);
    this.healthBarFill.setPosition(this.x - 14, this.y - 22);

    const healthPercent = this.health / this.maxHealth;
    this.healthBarFill.width = 28 * healthPercent;

    if (healthPercent < 0.3) {
      this.healthBarFill.setFillStyle(0xff4444);
    } else if (healthPercent < 0.6) {
      this.healthBarFill.setFillStyle(0xffaa00);
    } else {
      this.healthBarFill.setFillStyle(COLORS.HEALTH_BAR);
    }
  }

  chaseTarget(target) {
    if (!this.isAlive || !target) return;

    this.target = target;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);

    if (dist < this.detectionRange) {
      this.isChasing = true;

      if (dist > this.attackRange) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        this.body.setVelocity(
          Math.cos(angle) * this.speed,
          Math.sin(angle) * this.speed
        );
      } else {
        this.body.setVelocity(0, 0);
        this.tryAttack(target);
      }
    } else {
      this.isChasing = false;
      this.body.setVelocity(0, 0);
    }
  }

  tryAttack(target) {
    const now = this.scene.time.now;
    if (now - this.lastAttackTime < this.attackCooldown) return;

    this.lastAttackTime = now;

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.3,
      scaleY: 0.8,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        if (target && target.isAlive !== false) {
          const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
          if (dist <= this.attackRange * 1.2) {
            this.dealDamage(target);
          }
        }
      },
    });
  }

  dealDamage(target) {
    if (target.takeDamage) {
      target.takeDamage(this.damage);
    }
  }

  takeDamage(amount) {
    if (!this.isAlive) return;

    this.health -= amount;

    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.isAlive) this.clearTint();
    });

    if (this.scene.combatSystem) {
      this.scene.combatSystem.showDamageNumber(this.x, this.y, amount);
    }

    this.updateHealthBar();

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isAlive = false;

    this.body.setVelocity(0, 0);
    this.body.enable = false;

    if (this.scene.combatSystem) {
      this.scene.combatSystem.knockback(
        { x: this.x, y: this.y, body: { setVelocity: () => {} } },
        this.target || this,
        0
      );
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 1.5,
      duration: 300,
      onComplete: () => {
        if (this.target && this.target.gainXP) {
          this.target.gainXP(this.xpReward);
        }

        this.dropLoot();
        this.destroy();
      },
    });
  }

  dropLoot() {
    const lootTypes = ["health", "mana", "xp"];
    const lootChance = 0.4;

    if (Math.random() > lootChance) return;

    const type = Phaser.Utils.Array.GetRandom(lootTypes);
    const color = type === "health" ? COLORS.HEALTH_BAR :
                  type === "mana" ? COLORS.MANA_BAR : COLORS.XP_BAR;

    const loot = this.scene.add.circle(this.x, this.y, 6, color);
    loot.setDepth(5);
    this.scene.physics.add.existing(loot);

    this.scene.tweens.add({
      targets: loot,
      y: loot.y - 10,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.scene.physics.add.overlap(
      this.scene.player,
      loot,
      () => {
        if (type === "health") {
          this.scene.player.heal(20);
          if (this.scene.combatSystem) {
            this.scene.combatSystem.showHealNumber(this.scene.player.x, this.scene.player.y, 20);
          }
        } else if (type === "mana") {
          this.scene.player.mana = Math.min(
            this.scene.player.maxMana,
            this.scene.player.mana + 15
          );
        } else if (type === "xp") {
          this.scene.player.gainXP(15);
        }
        if (this.scene.game.audioSystem) {
          this.scene.game.audioSystem.playPickup();
        }
        loot.destroy();
      }
    );
  }

  destroy() {
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBarFill) this.healthBarFill.destroy();
    super.destroy();
  }
}
