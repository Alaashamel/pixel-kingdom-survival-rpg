import Phaser from "phaser";
import { COLORS } from "../constants.js";

export default class MobileControls {
  constructor(scene) {
    this.scene = scene;
    this.isMobile = this.detectMobile();
    this.joystick = null;
    this.attackButton = null;
    this.joystickInput = { x: 0, y: 0 };
    this.isAttacking = false;

    if (this.isMobile) {
      this.create();
    }
  }

  detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      ("ontouchstart" in window) ||
      (navigator.maxTouchPoints > 0)
    );
  }

  create() {
    this.createJoystick();
    this.createAttackButton();
  }

  createJoystick() {
    const baseSize = 80;
    const thumbSize = 40;
    const x = 100;
    const y = this.scene.cameras.main.height - 100;

    this.joystickBase = this.scene.add.circle(x, y, baseSize / 2, 0x000000, 0.4);
    this.joystickBase.setStrokeStyle(2, 0xffffff, 0.5);
    this.joystickBase.setScrollFactor(0);
    this.joystickBase.setDepth(500);
    this.joystickBase.setInteractive();

    this.joystickThumb = this.scene.add.circle(x, y, thumbSize / 2, 0xffffff, 0.5);
    this.joystickThumb.setScrollFactor(0);
    this.joystickThumb.setDepth(501);

    this.joystickBase.on("pointerdown", (pointer) => {
      this.joystickActive = true;
      this.joystickPointer = pointer;
    });

    this.scene.input.on("pointermove", (pointer) => {
      if (!this.joystickActive || pointer !== this.joystickPointer) return;
      if (!pointer.isDown) return;

      const dist = Phaser.Math.Distance.Between(
        this.joystickBase.x, this.joystickBase.y,
        pointer.x, pointer.y
      );

      const maxDist = baseSize / 2;
      const angle = Phaser.Math.Angle.Between(
        this.joystickBase.x, this.joystickBase.y,
        pointer.x, pointer.y
      );

      const clampedDist = Math.min(dist, maxDist);
      const thumbX = this.joystickBase.x + Math.cos(angle) * clampedDist;
      const thumbY = this.joystickBase.y + Math.sin(angle) * clampedDist;

      this.joystickThumb.setPosition(thumbX, thumbY);

      const normalizedDist = clampedDist / maxDist;
      this.joystickInput.x = Math.cos(angle) * normalizedDist;
      this.joystickInput.y = Math.sin(angle) * normalizedDist;
    });

    this.scene.input.on("pointerup", (pointer) => {
      if (pointer === this.joystickPointer) {
        this.joystickActive = false;
        this.joystickThumb.setPosition(
          this.joystickBase.x,
          this.joystickBase.y
        );
        this.joystickInput.x = 0;
        this.joystickInput.y = 0;
      }
    });
  }

  createAttackButton() {
    const x = this.scene.cameras.main.width - 80;
    const y = this.scene.cameras.main.height - 100;

    this.attackButton = this.scene.add.circle(x, y, 35, COLORS.UI_ACCENT, 0.6);
    this.attackButton.setStrokeStyle(3, 0xffffff, 0.8);
    this.attackButton.setScrollFactor(0);
    this.attackButton.setDepth(500);
    this.attackButton.setInteractive();

    this.attackButtonText = this.scene.add.text(x, y, "ATK", {
      fontSize: "14px",
      fill: "#ffffff",
      fontFamily: "monospace",
      fontStyle: "bold",
    });
    this.attackButtonText.setOrigin(0.5);
    this.attackButtonText.setScrollFactor(0);
    this.attackButtonText.setDepth(501);

    this.attackButton.on("pointerdown", () => {
      this.isAttacking = true;
      this.attackButton.setScale(0.9);
    });

    this.attackButton.on("pointerup", () => {
      this.isAttacking = false;
      this.attackButton.setScale(1);
    });

    this.attackButton.on("pointerout", () => {
      this.isAttacking = false;
      this.attackButton.setScale(1);
    });
  }

  getMovementInput() {
    if (!this.isMobile) return null;

    return {
      left: this.joystickInput.x < -0.2,
      right: this.joystickInput.x > 0.2,
      up: this.joystickInput.y < -0.2,
      down: this.joystickInput.y > 0.2,
      magnitude: Math.sqrt(
        this.joystickInput.x * this.joystickInput.x +
        this.joystickInput.y * this.joystickInput.y
      ),
    };
  }

  isAttackPressed() {
    if (!this.isMobile) return false;
    return this.isAttacking;
  }

  destroy() {
    if (this.joystickBase) this.joystickBase.destroy();
    if (this.joystickThumb) this.joystickThumb.destroy();
    if (this.attackButton) this.attackButton.destroy();
    if (this.attackButtonText) this.attackButtonText.destroy();
  }
}
