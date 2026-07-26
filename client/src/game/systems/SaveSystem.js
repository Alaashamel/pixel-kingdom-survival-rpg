const SAVE_KEY = "pixel_kingdom_save";
const MAX_SLOTS = 3;

export default class SaveSystem {
  constructor() {
    this.autoSaveInterval = 30000;
    this.autoSaveTimer = null;
  }

  save(slot, playerData, settings = {}) {
    if (slot < 0 || slot >= MAX_SLOTS) return false;

    const saveData = {
      version: "1.0",
      timestamp: Date.now(),
      date: new Date().toLocaleString(),
      player: {
        health: playerData.health,
        maxHealth: playerData.maxHealth,
        mana: playerData.mana,
        maxMana: playerData.maxMana,
        stamina: playerData.stamina,
        maxStamina: playerData.maxStamina,
        level: playerData.level,
        xp: playerData.xp,
        xpToNextLevel: playerData.xpToNextLevel,
        attackDamage: playerData.attackDamage,
        x: playerData.x,
        y: playerData.y,
      },
      settings,
    };

    try {
      const saves = this.getAllSaves();
      saves[slot] = saveData;
      localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
      return true;
    } catch {
      return false;
    }
  }

  load(slot) {
    if (slot < 0 || slot >= MAX_SLOTS) return null;

    try {
      const saves = this.getAllSaves();
      return saves[slot] || null;
    } catch {
      return null;
    }
  }

  delete(slot) {
    if (slot < 0 || slot >= MAX_SLOTS) return false;

    try {
      const saves = this.getAllSaves();
      saves[slot] = null;
      localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
      return true;
    } catch {
      return false;
    }
  }

  getAllSaves() {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (!data) return Array(MAX_SLOTS).fill(null);
      const saves = JSON.parse(data);
      while (saves.length < MAX_SLOTS) saves.push(null);
      return saves;
    } catch {
      return Array(MAX_SLOTS).fill(null);
    }
  }

  hasAnySave() {
    return this.getAllSaves().some((s) => s !== null);
  }

  getSaveInfo(slot) {
    const save = this.load(slot);
    if (!save) return null;

    return {
      level: save.player.level,
      date: save.date,
      timestamp: save.timestamp,
    };
  }

  startAutoSave(getPlayerData, getSettings, slot = 0) {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      const playerData = getPlayerData();
      const settings = getSettings();
      this.save(slot, playerData, settings);
    }, this.autoSaveInterval);
  }

  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  exportSave(slot) {
    const save = this.load(slot);
    if (!save) return null;
    return btoa(JSON.stringify(save));
  }

  importSave(slot, encodedData) {
    try {
      const data = JSON.parse(atob(encodedData));
      if (!data.player || !data.version) return false;
      return this.save(slot, data.player, data.settings || {});
    } catch {
      return false;
    }
  }
}
