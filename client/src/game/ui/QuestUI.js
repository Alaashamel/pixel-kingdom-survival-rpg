import { COLORS } from "../constants.js";

export default class QuestUI {
  constructor(scene, questSystem) {
    this.scene = scene;
    this.questSystem = questSystem;
    this.trackerContainer = null;
    this.logContainer = null;
    this.isLogOpen = false;
    this.notificationQueue = [];
    this.isShowingNotification = false;

    this.questSystem.onQuestComplete = (questId, quest) => {
      this.showCompletionNotification(questId, quest);
    };

    this.questSystem.onProgressUpdate = () => {
      this.updateTracker();
    };
  }

  createTracker() {
    this.trackerContainer = this.scene.add.container(0, 0);
    this.trackerContainer.setScrollFactor(0);
    this.trackerContainer.setDepth(100);

    const { width } = this.scene.cameras.main;

    const bg = this.scene.add.rectangle(width - 10, 100, 180, 60, COLORS.UI_BG, 0.8);
    bg.setOrigin(1, 0);
    bg.setStrokeStyle(1, COLORS.UI_ACCENT);
    this.trackerContainer.add(bg);

    this.trackerText = this.scene.add.text(width - 18, 108, "No active quests", {
      fontSize: "9px",
      fill: "#ffffff",
      fontFamily: "monospace",
      wordWrap: { width: 160 },
    });
    this.trackerText.setOrigin(1, 0);
    this.trackerContainer.add(this.trackerText);

    this.updateTracker();
  }

  updateTracker() {
    if (!this.trackerText) return;

    const quests = this.questSystem.getActiveQuests();
    if (quests.length === 0) {
      this.trackerText.setText("No active quests");
      return;
    }

    const lines = quests.slice(0, 2).map((q) => {
      return `${q.quest.name}\n  ${q.progress}/${q.quest.required} (${q.percent}%)`;
    });

    this.trackerText.setText(lines.join("\n\n"));

    const bg = this.trackerContainer.getFirst();
    if (bg) {
      bg.height = 20 + quests.length * 35;
    }
  }

  showCompletionNotification(questId, quest) {
    this.notificationQueue.push({ questId, quest });
    if (!this.isShowingNotification) {
      this.showNextNotification();
    }
  }

  showNextNotification() {
    if (this.notificationQueue.length === 0) {
      this.isShowingNotification = false;
      return;
    }

    this.isShowingNotification = true;
    const { quest } = this.notificationQueue.shift();
    const { width } = this.scene.cameras.main;

    const container = this.scene.add.container(0, 0);
    container.setScrollFactor(0);
    container.setDepth(300);

    const bg = this.scene.add.rectangle(width / 2, 60, 300, 50, COLORS.UI_BG, 0.95);
    bg.setStrokeStyle(2, 0x00ff00);
    container.add(bg);

    const title = this.scene.add.text(width / 2, 50, "Quest Complete!", {
      fontSize: "12px", fill: "#00ff00", fontFamily: "monospace", fontStyle: "bold",
    });
    title.setOrigin(0.5);
    container.add(title);

    const name = this.scene.add.text(width / 2, 68, quest.name, {
      fontSize: "10px", fill: "#ffffff", fontFamily: "monospace",
    });
    name.setOrigin(0.5);
    container.add(name);

    container.setAlpha(0);
    this.scene.tweens.add({
      targets: container, alpha: 1, y: 10, duration: 300,
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: container, alpha: 0, y: -20, duration: 300,
            onComplete: () => {
              container.destroy();
              this.showNextNotification();
            },
          });
        });
      },
    });
  }

  openLog() {
    if (this.isLogOpen) return;
    this.isLogOpen = true;

    const { width, height } = this.scene.cameras.main;

    this.logContainer = this.scene.add.container(0, 0);
    this.logContainer.setScrollFactor(0);
    this.logContainer.setDepth(300);

    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    this.logContainer.add(overlay);

    const panelW = 350;
    const panelH = 300;
    const px = width / 2;
    const py = height / 2;

    const panelBg = this.scene.add.rectangle(px, py, panelW, panelH, COLORS.UI_BG, 0.95);
    panelBg.setStrokeStyle(2, COLORS.UI_ACCENT);
    this.logContainer.add(panelBg);

    const title = this.scene.add.text(px, py - panelH / 2 + 18, "Quest Log", {
      fontSize: "18px", fill: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
    });
    title.setOrigin(0.5);
    this.logContainer.add(title);

    const quests = this.questSystem.getActiveQuests();
    let yPos = py - panelH / 2 + 45;

    if (quests.length === 0) {
      const empty = this.scene.add.text(px, py, "No active quests", {
        fontSize: "12px", fill: "#888888", fontFamily: "monospace",
      });
      empty.setOrigin(0.5);
      this.logContainer.add(empty);
    } else {
      quests.forEach((q) => {
        const questBg = this.scene.add.rectangle(px, yPos + 15, panelW - 30, 50, 0x1a1a2e);
        this.logContainer.add(questBg);

        const name = this.scene.add.text(px - 140, yPos + 2, q.quest.name, {
          fontSize: "11px", fill: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
        });
        this.logContainer.add(name);

        const desc = this.scene.add.text(px - 140, yPos + 16, q.quest.description, {
          fontSize: "9px", fill: "#aaaaaa", fontFamily: "monospace",
        });
        this.logContainer.add(desc);

        const progress = this.scene.add.text(px + 140, yPos + 10, `${q.progress}/${q.quest.required}`, {
          fontSize: "11px", fill: "#ffcc00", fontFamily: "monospace",
        });
        progress.setOrigin(1, 0.5);
        this.logContainer.add(progress);

        const barW = 100;
        const barBg = this.scene.add.rectangle(px + 140 - barW - 10, yPos + 28, barW, 6, 0x333333);
        barBg.setOrigin(0, 0.5);
        this.logContainer.add(barBg);

        const barFill = this.scene.add.rectangle(
          px + 140 - barW - 10, yPos + 28,
          barW * (q.percent / 100), 6, 0x00cc00
        );
        barFill.setOrigin(0, 0.5);
        this.logContainer.add(barFill);

        yPos += 58;
      });
    }

    const closeBtn = this.scene.add.text(px + panelW / 2 - 15, py - panelH / 2 + 12, "X", {
      fontSize: "16px", fill: "#ff6666", fontFamily: "monospace", fontStyle: "bold",
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => this.closeLog());
    this.logContainer.add(closeBtn);

    const hint = this.scene.add.text(px, py + panelH / 2 - 16, "Press L to close", {
      fontSize: "10px", fill: "#888888", fontFamily: "monospace",
    });
    hint.setOrigin(0.5);
    this.logContainer.add(hint);

    this.scene.tweens.add({
      targets: this.logContainer, alpha: { from: 0, to: 1 }, duration: 200,
    });
  }

  closeLog() {
    if (!this.isLogOpen || !this.logContainer) return;
    this.isLogOpen = false;
    this.scene.tweens.add({
      targets: this.logContainer, alpha: 0, duration: 150,
      onComplete: () => {
        if (this.logContainer) { this.logContainer.destroy(); this.logContainer = null; }
      },
    });
  }
}
