import { COLORS } from "../constants.js";
import { SKILL_BRANCHES } from "../systems/SkillTree.js";

const BRANCH_COLORS = {
  [SKILL_BRANCHES.ATTACK]: 0xff4444,
  [SKILL_BRANCHES.DEFENSE]: 0x4444ff,
  [SKILL_BRANCHES.UTILITY]: 0x44cc44,
};

const STATE_COLORS = {
  locked: 0x333333,
  available: 0x666622,
  unlocked: 0x226622,
};

const STATE_STROKE = {
  locked: 0x555555,
  available: 0xcccc00,
  unlocked: 0x00ff00,
};

export default class SkillTreeUI {
  constructor(scene, skillTree) {
    this.scene = scene;
    this.skillTree = skillTree;
    this.container = null;
    this.isOpen = false;
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    const { width, height } = this.scene.cameras.main;

    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(300);

    const overlay = this.scene.add.rectangle(
      width / 2, height / 2, width, height, 0x000000, 0.85
    );
    this.container.add(overlay);

    const panelW = 520;
    const panelH = 340;
    const px = width / 2;
    const py = height / 2;

    const panelBg = this.scene.add.rectangle(px, py, panelW, panelH, COLORS.UI_BG, 0.95);
    panelBg.setStrokeStyle(2, COLORS.UI_ACCENT);
    this.container.add(panelBg);

    const title = this.scene.add.text(px, py - panelH / 2 + 18, "Skill Tree", {
      fontSize: "18px", fill: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
    });
    title.setOrigin(0.5);
    this.container.add(title);

    const pointsText = this.scene.add.text(
      px + panelW / 2 - 10, py - panelH / 2 + 18,
      `Points: ${this.skillTree.skillPoints}`,
      { fontSize: "13px", fill: "#ffcc00", fontFamily: "monospace" }
    );
    pointsText.setOrigin(1, 0.5);
    this.container.add(pointsText);
    this.pointsText = pointsText;

    const branches = [
      { key: SKILL_BRANCHES.ATTACK, label: "Attack", x: px - 150 },
      { key: SKILL_BRANCHES.DEFENSE, label: "Defense", x: px },
      { key: SKILL_BRANCHES.UTILITY, label: "Utility", x: px + 150 },
    ];

    branches.forEach((branch) => {
      const label = this.scene.add.text(branch.x, py - panelH / 2 + 48, branch.label, {
        fontSize: "13px",
        fill: `#${BRANCH_COLORS[branch.key].toString(16).padStart(6, "0")}`,
        fontFamily: "monospace",
        fontStyle: "bold",
      });
      label.setOrigin(0.5);
      this.container.add(label);

      const skills = this.skillTree.getBranchSkills(branch.key);
      skills.sort((a, b) => a.tier - b.tier);

      skills.forEach((skill, idx) => {
        const nodeY = py - 40 + idx * 90;
        this.createSkillNode(branch.x, nodeY, skill);

        if (idx < skills.length - 1) {
          const line = this.scene.add.graphics();
          line.lineStyle(2, 0x555555);
          line.lineBetween(branch.x, nodeY + 22, branch.x, nodeY + 68);
          this.container.add(line);
        }
      });
    });

    const closeBtn = this.scene.add.text(px + panelW / 2 - 15, py - panelH / 2 + 12, "X", {
      fontSize: "16px", fill: "#ff6666", fontFamily: "monospace", fontStyle: "bold",
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => this.close());
    this.container.add(closeBtn);

    const hint = this.scene.add.text(px, py + panelH / 2 - 16, "Click a skill to unlock. Press T to close.", {
      fontSize: "10px", fill: "#888888", fontFamily: "monospace",
    });
    hint.setOrigin(0.5);
    this.container.add(hint);

    this.scene.tweens.add({
      targets: this.container, alpha: { from: 0, to: 1 }, duration: 200,
    });
  }

  createSkillNode(x, y, skill) {
    const state = this.skillTree.getSkillState(skill.id);
    const size = 40;

    const bg = this.scene.add.circle(x, y, size / 2, STATE_COLORS[state]);
    bg.setStrokeStyle(2, STATE_STROKE[state]);
    if (state !== "locked") {
      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", () => this.handleUnlock(skill.id));
      bg.on("pointerover", () => bg.setFillStyle(BRANCH_COLORS[skill.branch]));
      bg.on("pointerout", () => bg.setFillStyle(STATE_COLORS[this.skillTree.getSkillState(skill.id)]));
    }
    this.container.add(bg);

    const initial = skill.name.charAt(0);
    const icon = this.scene.add.text(x, y - 2, initial, {
      fontSize: "16px",
      fill: state === "unlocked" ? "#00ff00" : state === "available" ? "#cccc00" : "#888888",
      fontFamily: "monospace",
      fontStyle: "bold",
    });
    icon.setOrigin(0.5);
    this.container.add(icon);

    const nameText = this.scene.add.text(x, y + size / 2 + 6, skill.name, {
      fontSize: "9px",
      fill: state === "locked" ? "#666666" : "#ffffff",
      fontFamily: "monospace",
      fontStyle: "bold",
    });
    nameText.setOrigin(0.5, 0);
    this.container.add(nameText);

    const desc = this.scene.add.text(x, y + size / 2 + 18, skill.description, {
      fontSize: "8px", fill: "#aaaaaa", fontFamily: "monospace", wordWrap: { width: 100 },
    });
    desc.setOrigin(0.5, 0);
    this.container.add(desc);

    if (state !== "unlocked") {
      const cost = this.scene.add.text(x + size / 2 - 2, y - size / 2 + 2, `${skill.cost}`, {
        fontSize: "8px", fill: "#ffcc00", fontFamily: "monospace", fontStyle: "bold",
      });
      cost.setOrigin(1, 0);
      this.container.add(cost);
    }
  }

  handleUnlock(skillId) {
    const player = this.scene.player;
    if (!player) return;

    const success = this.skillTree.unlock(skillId, player);
    if (success) {
      if (this.scene.game.audioSystem) {
        this.scene.game.audioSystem.playLevelUp();
      }
      this.close();
      this.open();
    }
  }

  close() {
    if (!this.isOpen || !this.container) return;
    this.isOpen = false;
    this.scene.tweens.add({
      targets: this.container, alpha: 0, duration: 150,
      onComplete: () => {
        if (this.container) { this.container.destroy(); this.container = null; }
      },
    });
  }
}
