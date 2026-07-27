export const QUEST_TYPES = {
  KILL: "kill",
  COLLECT: "collect",
  SURVIVE: "survive",
  REACH: "reach",
};

export const QUESTS = {
  firstSteps: {
    id: "firstSteps",
    name: "First Steps",
    description: "Defeat 5 slimes to prove your worth",
    type: QUEST_TYPES.KILL,
    target: "slime",
    required: 5,
    reward: { xp: 50, gold: 20 },
  },
  stronger: {
    id: "stronger",
    name: "Getting Stronger",
    description: "Defeat 10 more slimes",
    type: QUEST_TYPES.KILL,
    target: "slime",
    required: 10,
    reward: { xp: 100, gold: 50 },
    requires: ["firstSteps"],
  },
  bossHunter: {
    id: "bossHunter",
    name: "Boss Hunter",
    description: "Defeat the boss at the dungeon",
    type: QUEST_TYPES.KILL,
    target: "boss",
    required: 1,
    reward: { xp: 300, gold: 200 },
    requires: ["stronger"],
  },
  survivor: {
    id: "survivor",
    name: "Survivor",
    description: "Survive for 60 seconds",
    type: QUEST_TYPES.SURVIVE,
    target: "time",
    required: 60,
    reward: { xp: 75, gold: 30 },
  },
  collector: {
    id: "collector",
    name: "Collector",
    description: "Collect 5 health potions",
    type: QUEST_TYPES.COLLECT,
    target: "health",
    required: 5,
    reward: { xp: 60, gold: 25 },
  },
};

export default class QuestSystem {
  constructor() {
    this.activeQuests = new Map();
    this.completedQuests = new Set();
    this.progress = new Map();
    this.startTime = Date.now();
    this.onQuestComplete = null;
    this.onProgressUpdate = null;
  }

  acceptQuest(questId) {
    const quest = QUESTS[questId];
    if (!quest) return false;
    if (this.activeQuests.has(questId)) return false;
    if (this.completedQuests.has(questId)) return false;

    if (quest.requires) {
      const met = quest.requires.every((req) => this.completedQuests.has(req));
      if (!met) return false;
    }

    this.activeQuests.set(questId, quest);
    this.progress.set(questId, 0);
    return true;
  }

  updateProgress(type, target, amount = 1) {
    this.activeQuests.forEach((quest, questId) => {
      if (quest.type === type && quest.target === target) {
        const current = this.progress.get(questId) || 0;
        const newProgress = current + amount;
        this.progress.set(questId, newProgress);

        if (this.onProgressUpdate) {
          this.onProgressUpdate(questId, newProgress, quest.required);
        }

        if (newProgress >= quest.required) {
          this.completeQuest(questId);
        }
      }
    });
  }

  checkTimeQuests() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.activeQuests.forEach((quest, questId) => {
      if (quest.type === QUEST_TYPES.SURVIVE && quest.target === "time") {
        this.progress.set(questId, Math.floor(elapsed));
        if (elapsed >= quest.required) {
          this.completeQuest(questId);
        }
      }
    });
  }

  completeQuest(questId) {
    const quest = this.activeQuests.get(questId);
    if (!quest) return;

    this.completedQuests.add(questId);
    this.activeQuests.delete(questId);
    this.progress.delete(questId);

    if (this.onQuestComplete) {
      this.onQuestComplete(questId, quest);
    }

    if (this.onRewardGranted) {
      this.onRewardGranted(quest.reward);
    }

    this.checkNewQuests();
  }

  checkNewQuests() {
    Object.keys(QUESTS).forEach((questId) => {
      if (!this.completedQuests.has(questId) && !this.activeQuests.has(questId)) {
        const quest = QUESTS[questId];
        if (!quest.requires || quest.requires.every((r) => this.completedQuests.has(r))) {
          this.acceptQuest(questId);
        }
      }
    });
  }

  getQuestProgress(questId) {
    const quest = this.activeQuests.get(questId);
    if (!quest) return null;
    return {
      quest,
      progress: this.progress.get(questId) || 0,
      required: quest.required,
      percent: Math.floor(((this.progress.get(questId) || 0) / quest.required) * 100),
    };
  }

  getActiveQuests() {
    const result = [];
    this.activeQuests.forEach((quest, questId) => {
      result.push({
        id: questId,
        quest,
        progress: this.progress.get(questId) || 0,
        percent: Math.floor(((this.progress.get(questId) || 0) / quest.required) * 100),
      });
    });
    return result;
  }

  isQuestCompleted(questId) {
    return this.completedQuests.has(questId);
  }

  serialize() {
    return {
      active: Object.fromEntries(this.activeQuests),
      completed: Array.from(this.completedQuests),
      progress: Object.fromEntries(this.progress),
      startTime: this.startTime,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.activeQuests = new Map(Object.entries(data.active || {}));
    this.completedQuests = new Set(data.completed || []);
    this.progress = new Map(Object.entries(data.progress || {}));
    this.startTime = data.startTime || Date.now();
  }
}
