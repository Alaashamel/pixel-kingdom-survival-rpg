import Phaser from "phaser";
import { COLORS } from "../constants.js";

export default class Boss extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y) {
    super(scene, x, y, 48, 48, 0x8b0000);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.baseColor = 0x8b0000;
    this.maxHealth = 500;
    this.health = this.maxHealth;
    this.attackDamage = 30;
    this.speed = 80;
    this.attackRange = 80;
    this.attackCooldown = 2000;
    this.lastAttackTime = 0;

    this.isCharging = false;
    this.chargeTarget = null;
    this.chargeSpeed = 300;
    this.aoeCooldown = 5000;
    this.lastAoeTime = 0;
    this.isAlive = true;
    this.respawnCooldown = 60000;
    this.respawnTimer = null;

    this.healthBarBg = null;
    this.healthBarFill = null;
    this.bossNameText = null;

    this.body.setCollideWorldBounds(true);
    this.body.setSize(40, 40);
    this.body.setOffset(4, 4);

    this.createHealthBar();
    this.createBossName();
  }

  createHealthBar() {
    const barWidth = 60;
    const barHeight = 6;

    this.healthBarBg = this.scene.add.rectangle(
      this.x, this.y - 35, barWidth, barHeight, 0x333333
    );
    this.healthBarBg.setDepth(10);

    this.healthBarFill = this.scene.add.rectangle(
      this.x - barWidth / 2, this.y - 35, barWidth, barHeight, COLORS.HEALTH_BAR
    );
    this.healthBarFill.setOrigin(0, 0.5);
    this.healthBarFill.setDepth(11);
  }

  createBossName() {
    this.bossNameText = this.scene.add.text(this.x, this.y - 48, "BOSS", {
      fontSize: "12px",
      fill: "#ff4444",
      fontFamily: "monospace",
      fontStyle: "bold",
    });
    this.bossNameText.setOrigin(0.5);
    this.bossNameText.setDepth(12);
  }

  update(time, player) {
    if (!this.isAlive || !player || !player.isAlive) return;

    this.updateHealthBar();

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (this.isCharging) {
      this.handleCharge();
    } else if (dist < this.attackRange) {
      this.performMeleeAttack(time, player);
    } else if (dist < 300) {
      if (time - this.lastAoeTime > this.aoeCooldown) {
        this.performAoeAttack(time, player);
      } else {
        this.chasePlayer(player);
      }
    } else {
      this.chasePlayer(player);
    }
  }

  chasePlayer(player) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.body.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );
  }

  performMeleeAttack(time, player) {
    if (time - this.lastAttackTime < this.attackCooldown) return;
    this.lastAttackTime = time;

    this.body.setVelocity(0, 0);

    if (Math.random() < 0.4) {
      this.startCharge(player);
    } else {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (dist < this.attackRange) {
        player.takeDamage(this.attackDamage);
        if (this.scene.combatSystem) {
          this.scene.combatSystem.showDamageNumber(player.x, player.y, this.attackDamage);
        }
      }
    }
  }

  startCharge(player) {
    this.isCharging = true;
    this.chargeTarget = { x: player.x, y: player.y };

    this.setFillStyle(0xffff00);
    this.scene.time.delayedCall(500, () => {
      if (this.isCharging) {
        const angle = Phaser.Math.Angle.Between(
          this.x, this.y, this.chargeTarget.x, this.chargeTarget.y
        );
        this.body.setVelocity(
          Math.cos(angle) * this.chargeSpeed,
          Math.sin(angle) * this.chargeSpeed
        );
      }
    });
  }

  handleCharge() {
    if (!this.chargeTarget) {
      this.isCharging = false;
      return;
    }

    const dist = Phaser.Math.Distance.Between(
      this.x, this.y, this.chargeTarget.x, this.chargeTarget.y
    );

    if (dist < 20) {
      this.isCharging = false;
      this.body.setVelocity(0, 0);
      this.setFillStyle(this.baseColor);
      this.chargeTarget = null;
    }
  }

  performAoeAttack(time) {
    this.lastAoeTime = time;
    this.body.setVelocity(0, 0);

    this.setFillStyle(0xff8800);
    const indicator = this.scene.add.circle(this.x, this.y, this.attackRange, 0xff0000, 0.3);
    indicator.setDepth(5);

    this.scene.tweens.add({
      targets: indicator,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        indicator.destroy();
        const dist = Phaser.Math.Distance.Between(
          this.x, this.y, this.scene.player.x, this.scene.player.y
        );
        if (dist < this.attackRange) {
          this.scene.player.takeDamage(Math.floor(this.attackDamage * 0.7));
          if (this.scene.combatSystem) {
            this.scene.combatSystem.showDamageNumber(
              this.scene.player.x, this.scene.player.y,
              Math.floor(this.attackDamage * 0.7)
            );
          }
        }
        this.setFillStyle(this.baseColor);
      },
    });
  }

  takeDamage(amount) {
    if (!this.isAlive) return;

    this.health -= amount;
    this.setFillStyle(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.setFillStyle(this.baseColor);
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  updateHealthBar() {
    if (!this.healthBarBg || !this.healthBarFill) return;

    this.healthBarBg.setPosition(this.x, this.y - 35);
    this.healthBarFill.setPosition(this.x - 30, this.y - 35);

    const healthPercent = Math.max(0, this.health / this.maxHealth);
    this.healthBarFill.width = 60 * healthPercent;

    if (this.bossNameText) {
      this.bossNameText.setPosition(this.x, this.y - 48);
    }
  }

  die() {
    this.isAlive = false;
    this.body.setVelocity(0, 0);

    if (this.scene.game.questSystem) {
      this.scene.game.questSystem.updateProgress("kill", "boss");
    }

    this.dropLoot();

    this.scene.tweens.add({
      targets: [this, this.healthBarBg, this.healthBarFill, this.bossNameText],
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.setVisible(false);
        if (this.healthBarBg) this.healthBarBg.setVisible(false);
        if (this.healthBarFill) this.healthBarFill.setVisible(false);
        if (this.bossNameText) this.bossNameText.setVisible(false);

        this.respawnTimer = this.scene.time.delayedCall(this.respawnCooldown, () => {
          this.respawn();
        });
      },
    });
  }

  dropLoot() {
    const drops = ["health", "health", "mana", "xp", "xp", "xp"];
    drops.forEach((type) => {
      const color = type === "health" ? COLORS.HEALTH_BAR :
                    type === "mana" ? COLORS.MANA_BAR : COLORS.XP_BAR;
      const loot = this.scene.add.circle(
        this.x + Phaser.Math.Between(-20, 20),
        this.y + Phaser.Math.Between(-20, 20),
        8, color
      );
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

      this.scene.physics.add.overlap(this.scene.player, loot, () => {
        if (type === "health") {
          this.scene.player.heal(30);
        } else if (type === "mana") {
          this.scene.player.mana = Math.min(this.scene.player.maxMana, this.scene.player.mana + 25);
        } else if (type === "xp") {
          this.scene.player.gainXP(30);
        }
        if (this.scene.game.audioSystem) {
          this.scene.game.audioSystem.playPickup();
        }
        loot.destroy();
      });
    });
  }

  respawn() {
    this.health = this.maxHealth;
    this.isAlive = true;
    this.body.setVelocity(0, 0);

    this.setPosition(
      this.x + Phaser.Math.Between(-50, 50),
      this.y + Phaser.Math.Between(-50, 50)
    );

    this.setAlpha(0);
    this.setVisible(true);
    if (this.healthBarBg) this.healthBarBg.setVisible(true);
    if (this.healthBarFill) this.healthBarFill.setVisible(true);
    if (this.bossNameText) this.bossNameText.setVisible(true);

    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 1000,
    });

    this.updateHealthBar();
  }

  destroy() {
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBarFill) this.healthBarFill.destroy();
    if (this.bossNameText) this.bossNameText.destroy();
    if (this.respawnTimer) this.respawnTimer.destroy();
    super.destroy();
  }
}
