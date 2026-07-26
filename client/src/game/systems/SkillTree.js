export const SKILL_BRANCHES = {
  ATTACK: "attack",
  DEFENSE: "defense",
  UTILITY: "utility",
};

export const SKILLS = {
  sharpBlade: {
    id: "sharpBlade",
    name: "Sharp Blade",
    branch: SKILL_BRANCHES.ATTACK,
    tier: 1,
    cost: 1,
    description: "+15% attack damage",
    icon: "slash",
    effect: (player) => { player.attackDamage = Math.floor(player.attackDamage * 1.15); },
  },
  criticalStrike: {
    id: "criticalStrike",
    name: "Critical Strike",
    branch: SKILL_BRANCHES.ATTACK,
    tier: 2,
    cost: 1,
    requires: ["sharpBlade"],
    description: "15% chance for 2x damage",
    icon: "crit",
    effect: (player) => { player.critChance = (player.critChance || 0) + 0.15; },
  },
  whirlwind: {
    id: "whirlwind",
    name: "Whirlwind",
    branch: SKILL_BRANCHES.ATTACK,
    tier: 3,
    cost: 2,
    requires: ["criticalStrike"],
    description: "Spin attack hits all nearby enemies",
    icon: "spin",
    effect: () => {},
  },
  thickSkin: {
    id: "thickSkin",
    name: "Thick Skin",
    branch: SKILL_BRANCHES.DEFENSE,
    tier: 1,
    cost: 1,
    description: "+25 max health",
    icon: "shield",
    effect: (player) => { player.maxHealth += 25; player.health += 25; },
  },
  ironWill: {
    id: "ironWill",
    name: "Iron Will",
    branch: SKILL_BRANCHES.DEFENSE,
    tier: 2,
    cost: 1,
    requires: ["thickSkin"],
    description: "+30% damage reduction",
    icon: "armor",
    effect: (player) => { player.damageReduction = (player.damageReduction || 0) + 0.3; },
  },
  lastStand: {
    id: "lastStand",
    name: "Last Stand",
    branch: SKILL_BRANCHES.DEFENSE,
    tier: 3,
    cost: 2,
    requires: ["ironWill"],
    description: "Survive lethal damage once per minute",
    icon: "heart",
    effect: () => {},
  },
  swiftFeet: {
    id: "swiftFeet",
    name: "Swift Feet",
    branch: SKILL_BRANCHES.UTILITY,
    tier: 1,
    cost: 1,
    description: "+20% movement speed",
    icon: "boot",
    effect: (player) => { player.speed = Math.floor(player.speed * 1.2); },
  },
  dash: {
    id: "dash",
    name: "Dash",
    branch: SKILL_BRANCHES.UTILITY,
    tier: 2,
    cost: 1,
    requires: ["swiftFeet"],
    description: "Press SHIFT to dash forward",
    icon: "dash",
    effect: () => {},
  },
  treasureHunter: {
    id: "treasureHunter",
    name: "Treasure Hunter",
    branch: SKILL_BRANCHES.UTILITY,
    tier: 3,
    cost: 2,
    requires: ["dash"],
    description: "+50% loot drop rate",
    icon: "gem",
    effect: (player) => { player.lootBonus = (player.lootBonus || 0) + 0.5; },
  },
};

export default class SkillTree {
  constructor() {
    this.unlockedSkills = new Set();
    this.skillPoints = 0;
  }

  addSkillPoints(amount) {
    this.skillPoints += amount;
  }

  canUnlock(skillId) {
    const skill = SKILLS[skillId];
    if (!skill) return false;
    if (this.unlockedSkills.has(skillId)) return false;
    if (this.skillPoints < skill.cost) return false;
    if (skill.requires) {
      return skill.requires.every((req) => this.unlockedSkills.has(req));
    }
    return true;
  }

  unlock(skillId, player) {
    if (!this.canUnlock(skillId)) return false;
    const skill = SKILLS[skillId];
    this.skillPoints -= skill.cost;
    this.unlockedSkills.add(skillId);
    skill.effect(player);
    return true;
  }

  hasSkill(skillId) {
    return this.unlockedSkills.has(skillId);
  }

  getBranchSkills(branch) {
    return Object.values(SKILLS).filter((s) => s.branch === branch);
  }

  getSkillState(skillId) {
    if (this.unlockedSkills.has(skillId)) return "unlocked";
    if (this.canUnlock(skillId)) return "available";
    return "locked";
  }

  serialize() {
    return {
      unlocked: Array.from(this.unlockedSkills),
      points: this.skillPoints,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.unlockedSkills = new Set(data.unlocked || []);
    this.skillPoints = data.points || 0;
  }
}
