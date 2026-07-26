import Phaser from "phaser";

export default class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.damageNumbers = [];
  }

  createAttackEffect(x, y, facing) {
    const angle = this.getFacingAngle(facing);
    const effectX = x + Math.cos(angle) * 30;
    const effectY = y + Math.sin(angle) * 30;

    const slash = this.scene.add.graphics();
    slash.lineStyle(3, 0xffffff, 0.9);

    const startAngle = angle - 0.8;
    const endAngle = angle + 0.8;
    slash.beginPath();
    slash.arc(effectX, effectY, 28, startAngle, endAngle, false);
    slash.strokePath();
    slash.setDepth(15);

    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      onComplete: () => slash.destroy(),
    });

    const particles = this.scene.add.particles(effectX, effectY, "particle_0", {
      speed: { min: 30, max: 80 },
      angle: { min: Phaser.Math.RadToDeg(startAngle), max: Phaser.Math.RadToDeg(endAngle) },
      lifespan: 300,
      quantity: 5,
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    particles.setDepth(15);
    particles.explode(5);

    this.scene.time.delayedCall(400, () => particles.destroy());
  }

  showDamageNumber(x, y, amount, isCritical = false) {
    const color = isCritical ? "#ff4444" : "#ffffff";
    const fontSize = isCritical ? "20px" : "14px";

    const text = this.scene.add.text(x, y - 20, `-${amount}`, {
      fontSize,
      fill: color,
      fontFamily: "monospace",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    });
    text.setOrigin(0.5);
    text.setDepth(50);

    this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: "Power2",
      onComplete: () => text.destroy(),
    });
  }

  showHealNumber(x, y, amount) {
    const text = this.scene.add.text(x, y - 20, `+${amount}`, {
      fontSize: "14px",
      fill: "#00ff00",
      fontFamily: "monospace",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    });
    text.setOrigin(0.5);
    text.setDepth(50);

    this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: "Power2",
      onComplete: () => text.destroy(),
    });
  }

  getAttackHitbox(x, y, facing, range) {
    const angle = this.getFacingAngle(facing);
    const hitX = x + Math.cos(angle) * (range * 0.4);
    const hitY = y + Math.sin(angle) * (range * 0.4);

    return new Phaser.Geom.Circle(hitX, hitY, range * 0.9);
  }

  getFacingAngle(facing) {
    switch (facing) {
      case "right": return 0;
      case "down": return Math.PI / 2;
      case "left": return Math.PI;
      case "up": return -Math.PI / 2;
      default: return 0;
    }
  }

  knockback(target, source, force = 200) {
    const angle = Phaser.Math.Angle.Between(
      source.x, source.y,
      target.x, target.y
    );

    const vx = Math.cos(angle) * force;
    const vy = Math.sin(angle) * force;

    target.body.setVelocity(vx, vy);

    this.scene.tweens.add({
      targets: target.body.velocity,
      x: 0,
      y: 0,
      duration: 300,
      ease: "Power2",
    });
  }
}
