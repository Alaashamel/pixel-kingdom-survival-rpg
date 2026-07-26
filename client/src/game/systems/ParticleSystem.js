import Phaser from "phaser";

export default class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
  }

  emitAttackParticles(x, y, facing) {
    const colors = [0xffffff, 0xffff00, 0xffaa00];
    const angle = this.getFacingAngle(facing);

    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.circle(x, y, 3, colors[i % colors.length]);
      particle.setDepth(15);

      const spread = (i - 2.5) * 0.3;
      const targetX = x + Math.cos(angle + spread) * 40;
      const targetY = y + Math.sin(angle + spread) * 40;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 200,
        ease: "Power2",
        onComplete: () => particle.destroy(),
      });
    }
  }

  emitDamageParticles(x, y, damage, isCritical) {
    const count = isCritical ? 12 : 6;
    const color = isCritical ? 0xff0000 : 0xff6600;

    for (let i = 0; i < count; i++) {
      const size = isCritical ? Phaser.Math.Between(2, 5) : Phaser.Math.Between(1, 3);
      const particle = this.scene.add.circle(x, y, size, color);
      particle.setDepth(15);

      const angle = Math.random() * Math.PI * 2;
      const dist = Phaser.Math.Between(20, 50);
      const targetX = x + Math.cos(angle) * dist;
      const targetY = y + Math.sin(angle) * dist;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: Phaser.Math.Between(300, 500),
        ease: "Power2",
        onComplete: () => particle.destroy(),
      });
    }
  }

  emitHealParticles(x, y, amount) {
    const count = Math.min(amount / 5, 10);

    for (let i = 0; i < count; i++) {
      const particle = this.scene.add.circle(
        x + Phaser.Math.Between(-10, 10),
        y + Phaser.Math.Between(-10, 10),
        4, 0x00ff00
      );
      particle.setDepth(15);

      this.scene.tweens.add({
        targets: particle,
        y: y - 40,
        alpha: 0,
        duration: Phaser.Math.Between(400, 700),
        ease: "Power1",
        onComplete: () => particle.destroy(),
      });
    }
  }

  emitDeathParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
      const size = Phaser.Math.Between(2, 6);
      const particle = this.scene.add.circle(x, y, size, color);
      particle.setDepth(15);

      const angle = Math.random() * Math.PI * 2;
      const dist = Phaser.Math.Between(30, 80);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: Phaser.Math.Between(400, 800),
        ease: "Power2",
        onComplete: () => particle.destroy(),
      });
    }
  }

  emitLevelUpParticles(x, y) {
    for (let i = 0; i < 20; i++) {
      const colors = [0xffee58, 0xffd700, 0xffffff];
      const particle = this.scene.add.circle(x, y, Phaser.Math.Between(2, 5), colors[i % 3]);
      particle.setDepth(20);

      const angle = (i / 20) * Math.PI * 2;
      const dist = Phaser.Math.Between(40, 100);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: Phaser.Math.Between(500, 1000),
        ease: "Power2",
        onComplete: () => particle.destroy(),
      });
    }
  }

  emitChargeTrail(x, y) {
    for (let i = 0; i < 3; i++) {
      const particle = this.scene.add.circle(
        x + Phaser.Math.Between(-5, 5),
        y + Phaser.Math.Between(-5, 5),
        Phaser.Math.Between(2, 4), 0xffff00
      );
      particle.setDepth(14);

      this.scene.tweens.add({
        targets: particle,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 300,
        onComplete: () => particle.destroy(),
      });
    }
  }

  screenFlash(color, duration) {
    const { width, height } = this.scene.cameras.main;
    const flash = this.scene.add.rectangle(width / 2, height / 2, width, height, color, 0.4);
    flash.setScrollFactor(0);
    flash.setDepth(200);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration || 200,
      onComplete: () => flash.destroy(),
    });
  }

  getFacingAngle(facing) {
    switch (facing) {
      case "up": return -Math.PI / 2;
      case "down": return Math.PI / 2;
      case "left": return Math.PI;
      case "right": return 0;
      default: return 0;
    }
  }
}
