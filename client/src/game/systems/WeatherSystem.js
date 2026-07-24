import Phaser from "phaser";

export default class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.isRaining = false;
    this.rainParticles = null;
    this.dayNightOverlay = null;
    this.timeOfDay = 0;
    this.dayDuration = 120000;
    this.overlay = null;
  }

  create() {
    this.createDayNightCycle();
    this.createRainSystem();
    this.createAmbientParticles();
  }

  createDayNightCycle() {
    const { width, height } = this.scene.cameras.main;

    this.overlay = this.scene.add.rectangle(
      width / 2, height / 2, width, height, 0x000022, 0
    );
    this.overlay.setScrollFactor(0);
    this.overlay.setDepth(400);
    this.overlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  createRainSystem() {
    const { width, height } = this.scene.cameras.main;

    this.rainContainer = this.scene.add.container(0, 0);
    this.rainContainer.setScrollFactor(0);
    this.rainContainer.setDepth(450);
    this.rainContainer.setAlpha(0);

    this.rainDrops = [];
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(-height, height);
      const length = Phaser.Math.Between(8, 16);

      const drop = this.scene.add.rectangle(
        x, y, 1, length, 0xaaddff, 0.6
      );
      this.rainContainer.add(drop);
      this.rainDrops.push({
        sprite: drop,
        speed: Phaser.Math.Between(400, 700),
        length,
      });
    }
  }

  createAmbientParticles() {
    const { width, height } = this.scene.cameras.main;

    this.ambientContainer = this.scene.add.container(0, 0);
    this.ambientContainer.setScrollFactor(0);
    this.ambientContainer.setDepth(390);

    this.dustParticles = [];
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 3);

      const dust = this.scene.add.circle(x, y, size, 0xffffff, 0.2);
      this.ambientContainer.add(dust);
      this.dustParticles.push({
        sprite: dust,
        baseX: x,
        baseY: y,
        speed: Phaser.Math.FloatBetween(0.2, 0.8),
        offset: Phaser.Math.FloatBetween(0, Math.PI * 2),
      });
    }
  }

  startRain() {
    if (this.isRaining) return;
    this.isRaining = true;

    this.scene.tweens.add({
      targets: this.rainContainer,
      alpha: 0.8,
      duration: 2000,
    });
  }

  stopRain() {
    if (!this.isRaining) return;
    this.isRaining = false;

    this.scene.tweens.add({
      targets: this.rainContainer,
      alpha: 0,
      duration: 2000,
    });
  }

  update(time) {
    this.updateDayNight(time);
    this.updateRain();
    this.updateAmbientParticles(time);
  }

  updateDayNight(time) {
    this.timeOfDay = (time % this.dayDuration) / this.dayDuration;

    let alpha;
    let tint = 0x000022;

    if (this.timeOfDay < 0.25) {
      alpha = 0.3 * (1 - this.timeOfDay * 4);
      tint = 0x001133;
    } else if (this.timeOfDay < 0.5) {
      alpha = 0;
    } else if (this.timeOfDay < 0.75) {
      alpha = 0.3 * ((this.timeOfDay - 0.5) * 4);
      tint = 0x110022;
    } else {
      alpha = 0.3 + 0.2 * ((this.timeOfDay - 0.75) * 4);
      tint = 0x000033;
    }

    if (this.overlay) {
      this.overlay.setFillStyle(tint, alpha);
    }
  }

  updateRain() {
    if (!this.isRaining) return;

    const { height } = this.scene.cameras.main;

    this.rainDrops.forEach((drop) => {
      drop.sprite.y += drop.speed * 0.016;
      drop.sprite.x -= 1;

      if (drop.sprite.y > height + drop.length) {
        drop.sprite.y = -drop.length;
        drop.sprite.x = Phaser.Math.Between(0, height);
      }
    });
  }

  updateAmbientParticles(time) {
    const { width, height } = this.scene.cameras.main;

    this.dustParticles.forEach((dust) => {
      dust.sprite.x = dust.baseX + Math.sin(time * 0.001 * dust.speed + dust.offset) * 30;
      dust.sprite.y = dust.baseY + Math.cos(time * 0.0007 * dust.speed + dust.offset) * 20;
      dust.sprite.alpha = 0.1 + Math.sin(time * 0.002 + dust.offset) * 0.1;

      if (dust.sprite.x < -10) dust.baseX = width + 10;
      if (dust.sprite.x > width + 10) dust.baseX = -10;
      if (dust.sprite.y < -10) dust.baseY = height + 10;
      if (dust.sprite.y > height + 10) dust.baseY = -10;
    });
  }

  getTimeString() {
    const hours = Math.floor(this.timeOfDay * 24);
    const minutes = Math.floor((this.timeOfDay * 24 - hours) * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  isNight() {
    return this.timeOfDay > 0.75 || this.timeOfDay < 0.2;
  }

  destroy() {
    if (this.overlay) this.overlay.destroy();
    if (this.rainContainer) this.rainContainer.destroy();
    if (this.ambientContainer) this.ambientContainer.destroy();
  }
}
