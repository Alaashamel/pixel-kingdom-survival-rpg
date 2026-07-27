import Phaser from "phaser";
import { COLORS } from "../constants.js";
import { SHOP_ITEMS } from "../systems/ShopSystem.js";

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
    this.detectionRange = config.detectionRange || 250;
    this.enemyType = config.enemyType || "slime";

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
    if (!this.isAlive || !this.healthBarBg || !this.healthBarFill) return;

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
    if (!this.isAlive || !target || !target.isAlive) return;

    this.target = target;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);

    if (dist < this.detectionRange) {
      this.isChasing = true;

      if (dist > 10) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        this.body.setVelocity(
          Math.cos(angle) * this.speed,
          Math.sin(angle) * this.speed
        );
      } else {
        this.body.setVelocity(0, 0);
      }
    } else {
      this.isChasing = false;
      this.body.setVelocity(0, 0);
    }
  }

  dealDamage(target) {
    if (!this.isAlive || !target || !target.isAlive) return;
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
    if (!this.isAlive) return;
    this.isAlive = false;

    this.body.setVelocity(0, 0);
    this.body.enable = false;

    if (this.healthBarBg) this.healthBarBg.setVisible(false);
    if (this.healthBarFill) this.healthBarFill.setVisible(false);

    if (this.scene.particleSystem) {
      this.scene.particleSystem.emitDeathParticles(this.x, this.y, 0xff4444);
    }

    const savedScene = this.scene;
    const savedTarget = this.target;
    const xpReward = this.xpReward;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 1.5,
      duration: 300,
      onComplete: () => {
        if (savedTarget && savedTarget.gainXP) {
          savedTarget.gainXP(xpReward);
        }

        if (savedScene.game.questSystem) {
          savedScene.game.questSystem.updateProgress("kill", this.enemyType);
        }

        this.dropLoot(savedScene);
        this.remove();
      },
    });
  }

  dropLoot(scene) {
    const s = scene || this.scene;
    if (!s || !s.player) return;

    if (Math.random() < 0.5) {
      const goldAmount = Phaser.Math.Between(5, 15);
      const goldOrb = s.add.circle(this.x, this.y, 5, 0xffd700);
      goldOrb.setDepth(5);
      s.physics.add.existing(goldOrb);

      const goldTween = s.tweens.add({
        targets: goldOrb,
        y: goldOrb.y - 8,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      const playerRef = s.player;
      s.physics.add.overlap(playerRef, goldOrb, () => {
        if (!goldOrb.active) return;
        if (goldTween && goldTween.isPlaying()) goldTween.stop();
        if (goldOrb.body) goldOrb.body.enable = false;
        playerRef.gold += goldAmount;
        if (s.game.audioSystem) {
          try { s.game.audioSystem.playPickup(); } catch { /* ignore */ }
        }
        goldOrb.destroy();
      });
    }

    const lootTypes = ["health", "mana", "xp"];
    const lootChance = 0.4;

    if (Math.random() < 0.12) {
      const dropItems = SHOP_ITEMS.filter((i) => i.type !== "consumable" || i.price <= 30);
      const droppedItem = Phaser.Utils.Array.GetRandom(dropItems);
      const itemColor = droppedItem.type === "weapon" ? 0xaaaaaa :
                        droppedItem.type === "armor" ? 0x4488ff :
                        droppedItem.type === "accessory" ? 0xffaa00 : 0xff4444;

      const orb = s.add.circle(this.x, this.y, 7, itemColor);
      orb.setDepth(5);
      s.physics.add.existing(orb);

      const itemTween = s.tweens.add({
        targets: orb,
        y: orb.y - 10,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      const playerRef = s.player;
      const audioRef = s.game.audioSystem;

      s.physics.add.overlap(playerRef, orb, () => {
        if (!orb.active) return;
        if (itemTween && itemTween.isPlaying()) itemTween.stop();
        if (orb.body) orb.body.enable = false;

        const shop = s.game.shopSystem;
        if (shop) {
          const existing = shop.inventory.find((i) => i.id === droppedItem.id);
          if (existing) {
            existing.count++;
          } else {
            shop.inventory.push({ ...droppedItem, count: 1 });
          }
        }

        if (audioRef) {
          try { audioRef.playPickup(); } catch { /* ignore */ }
        }

        orb.destroy();
      });

      return;
    }

    if (Math.random() > lootChance) return;

    const type = Phaser.Utils.Array.GetRandom(lootTypes);
    const color = type === "health" ? COLORS.HEALTH_BAR :
                  type === "mana" ? COLORS.MANA_BAR : COLORS.XP_BAR;

    const loot = s.add.circle(this.x, this.y, 6, color);
    loot.setDepth(5);
    s.physics.add.existing(loot);

    const lootTween = s.tweens.add({
      targets: loot,
      y: loot.y - 10,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const playerRef = s.player;
    const audioRef = s.game.audioSystem;
    const questRef = s.game.questSystem;
    const combatRef = s.combatSystem;

    s.physics.add.overlap(
      playerRef,
      loot,
      () => {
        if (!loot.active) return;

        if (lootTween && lootTween.isPlaying()) {
          lootTween.stop();
        }
        if (loot.body) loot.body.enable = false;

        if (type === "health") {
          playerRef.heal(20);
          if (combatRef) {
            combatRef.showHealNumber(playerRef.x, playerRef.y, 20);
          }
          if (questRef) {
            questRef.updateProgress("collect", "health");
          }
        } else if (type === "mana") {
          playerRef.mana = Math.min(
            playerRef.maxMana,
            playerRef.mana + 15
          );
        } else if (type === "xp") {
          playerRef.gainXP(15);
        }
        if (audioRef) {
          audioRef.playPickup();
        }
        loot.destroy();
      }
    );
  }

  remove() {
    if (!this.scene) return;
    if (this.scene.enemyGroup) {
      this.scene.enemyGroup.remove(this, true, true);
    }
    this.destroy();
  }

  destroy() {
    if (this.healthBarBg) { this.healthBarBg.destroy(); this.healthBarBg = null; }
    if (this.healthBarFill) { this.healthBarFill.destroy(); this.healthBarFill = null; }
    super.destroy();
  }
}
