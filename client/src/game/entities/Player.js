import Phaser from "phaser";
import { PLAYER, WORLD } from "../constants.js";

class Player extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y) {
    super(scene, x, y, 32, 32, 0x00e676);

    scene.add.existing(this);

    this.baseColor = 0x00e676;
    this.speed = PLAYER.SPEED;
    this.sprintSpeed = PLAYER.SPRINT_SPEED;
    this.isSprinting = false;

    this.health = PLAYER.MAX_HEALTH;
    this.maxHealth = PLAYER.MAX_HEALTH;
    this.mana = PLAYER.MAX_MANA;
    this.maxMana = PLAYER.MAX_MANA;
    this.stamina = PLAYER.MAX_STAMINA;
    this.maxStamina = PLAYER.MAX_STAMINA;
    this.staminaRegen = PLAYER.STAMINA_REGEN;

    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 100;

    this.attackDamage = PLAYER.ATTACK_DAMAGE;
    this.attackRange = PLAYER.ATTACK_RANGE;
    this.attackCooldown = PLAYER.ATTACK_COOLDOWN;
    this.lastAttackTime = 0;
    this.isAttacking = false;

    this.facing = "down";
    this.isAlive = true;
    this.onLevelUp = null;
    this.onDeath = null;

    this.critChance = 0;
    this.damageReduction = 0;
    this.lootBonus = 0;
    this.lastStandReady = true;

    scene.physics.add.existing(this);
    this.body.setCollideWorldBounds(true);
    this.body.setSize(24, 24);
    this.body.setOffset(4, 4);

    this.setDepth(10);
  }

  move(cursors, wasd) {
    let vx = 0;
    let vy = 0;

    const left = cursors.left.isDown || (wasd && wasd.left.isDown);
    const right = cursors.right.isDown || (wasd && wasd.right.isDown);
    const up = cursors.up.isDown || (wasd && wasd.up.isDown);
    const down = cursors.down.isDown || (wasd && wasd.down.isDown);

    if (left) {
      vx = -1;
      this.facing = "left";
    } else if (right) {
      vx = 1;
      this.facing = "right";
    }

    if (up) {
      vy = -1;
      this.facing = "up";
    } else if (down) {
      vy = 1;
      this.facing = "down";
    }

    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.isSprinting = cursors.shift.isDown && this.stamina > 0;
    const currentSpeed = this.isSprinting ? this.sprintSpeed : this.speed;

    this.body.setVelocity(vx * currentSpeed, vy * currentSpeed);

    if (this.isSprinting && (vx !== 0 || vy !== 0)) {
      this.stamina = Math.max(0, this.stamina - 0.5);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen);
    }

    this.updateFacing();
  }

  updateFacing() {
    switch (this.facing) {
      case "left":
        this.setScale(-1, 1);
        break;
      case "right":
        this.setScale(1, 1);
        break;
      case "up":
        this.setScale(1, -1);
        break;
      case "down":
        this.setScale(1, 1);
        break;
    }
  }

  attack() {
    const now = this.scene.time.now;
    if (now - this.lastAttackTime < this.attackCooldown) return false;
    if (this.mana < 5) return false;

    this.lastAttackTime = now;
    this.isAttacking = true;
    this.mana -= 5;

    this.scene.time.delayedCall(200, () => {
      this.isAttacking = false;
    });

    return true;
  }

  takeDamage(amount) {
    let finalDamage = Math.floor(amount * (1 - this.damageReduction));
    if (finalDamage < 1) finalDamage = 1;

    if (this.health - finalDamage <= 0 && this.lastStandReady && this.scene.game.skillTree?.hasSkill("lastStand")) {
      this.health = 1;
      this.lastStandReady = false;
      this.scene.time.delayedCall(60000, () => { this.lastStandReady = true; });
      this.setFillStyle(0xffff00);
      this.scene.time.delayedCall(300, () => { this.setFillStyle(this.baseColor); });
      return;
    }

    this.health = Math.max(0, this.health - finalDamage);

    this.setFillStyle(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.setFillStyle(this.baseColor);
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  heal(amount) {
    const actualHeal = Math.min(amount, this.maxHealth - this.health);
    this.health = Math.min(this.maxHealth, this.health + amount);
    if (this.scene.particleSystem && actualHeal > 0) {
      this.scene.particleSystem.emitHealParticles(this.x, this.y, actualHeal);
    }
  }

  gainXP(amount) {
    this.xp += amount;

    while (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);

    this.maxHealth += 10;
    this.health = this.maxHealth;
    this.maxMana += 5;
    this.mana = this.maxMana;
    this.attackDamage += 2;

    if (this.scene.game.skillTree) {
      this.scene.game.skillTree.addSkillPoints(1);
    }

    this.setFillStyle(0xffee58);
    if (this.scene.particleSystem) {
      this.scene.particleSystem.emitLevelUpParticles(this.x, this.y);
    }
    this.scene.time.delayedCall(300, () => {
      this.setFillStyle(this.baseColor);
    });

    if (this.onLevelUp) {
      this.onLevelUp(this.level);
    }
  }

  die() {
    this.isAlive = false;
    this.scene.physics.pause();
    this.setFillStyle(0xff0000);

    this.scene.cameras.main.shake(500, 0.02);

    if (this.onDeath) this.onDeath();

    this.scene.time.delayedCall(1500, () => {
      this.health = this.maxHealth;
      this.mana = this.maxMana;
      this.stamina = this.maxStamina;
      this.isAlive = true;
      this.setPosition(WORLD.WIDTH / 2, WORLD.HEIGHT / 2);
      this.setFillStyle(this.baseColor);
      this.scene.physics.resume();
    });
  }
}

export default Player;
