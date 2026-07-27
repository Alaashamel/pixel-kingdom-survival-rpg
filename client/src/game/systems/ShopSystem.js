export const SHOP_ITEMS = [
  { id: "health_potion", name: "Health Potion", type: "consumable", subtype: "heal", price: 25, sellPrice: 10, description: "Restores 40 HP", effect: { heal: 40 } },
  { id: "mana_potion", name: "Mana Potion", type: "consumable", subtype: "mana", price: 20, sellPrice: 8, description: "Restores 30 MP", effect: { mana: 30 } },
  { id: "iron_sword", name: "Iron Sword", type: "weapon", subtype: "damage", price: 150, sellPrice: 60, description: "+10 Attack Damage", effect: { attackDamage: 10 } },
  { id: "steel_blade", name: "Steel Blade", type: "weapon", subtype: "damage", price: 350, sellPrice: 140, description: "+25 Attack Damage", effect: { attackDamage: 25 } },
  { id: "wooden_shield", name: "Wooden Shield", type: "armor", subtype: "defense", price: 80, sellPrice: 30, description: "+10% Damage Reduction", effect: { damageReduction: 0.1 } },
  { id: "iron_armor", name: "Iron Armor", type: "armor", subtype: "defense", price: 250, sellPrice: 100, description: "+25% Damage Reduction", effect: { damageReduction: 0.25 } },
  { id: "speed_boots", name: "Speed Boots", type: "accessory", subtype: "speed", price: 200, sellPrice: 80, description: "+15% Move Speed", effect: { speedBonus: 0.15 } },
  { id: "crit_ring", name: "Crit Ring", type: "accessory", subtype: "crit", price: 300, sellPrice: 120, description: "+10% Crit Chance", effect: { critChance: 0.1 } },
  { id: "xp_tome", name: "Tome of Knowledge", type: "consumable", subtype: "xp", price: 100, sellPrice: 40, description: "Grants 50 XP", effect: { xp: 50 } },
  { id: "max_hp_ring", name: "Vitality Ring", type: "accessory", subtype: "maxhp", price: 275, sellPrice: 110, description: "+20 Max HP", effect: { maxHealth: 20 } },
];

export default class ShopSystem {
  constructor(scene) {
    this.scene = scene;
    this.inventory = [];
    this.equipped = { weapon: null, armor: null, accessory: null };
  }

  getAvailableItems() {
    return SHOP_ITEMS;
  }

  buyItem(itemId) {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return { success: false, message: "Item not found" };

    const player = this.scene.player;
    if (!player) return { success: false, message: "No player" };

    if (player.gold < item.price) {
      return { success: false, message: "Not enough gold" };
    }

    player.gold -= item.price;

    if (item.type === "consumable") {
      const existing = this.inventory.find(
        (i) => i.id === item.id
      );
      if (existing) {
        existing.count++;
      } else {
        this.inventory.push({ ...item, count: 1 });
      }
      this.applyConsumable(item);
    } else {
      this.equipItem(item);
    }

    if (this.scene.game.audioSystem) {
      try { this.scene.game.audioSystem.playPickup(); } catch { /* ignore */ }
    }

    return { success: true, message: `Bought ${item.name}` };
  }

  sellItem(inventoryIndex) {
    if (inventoryIndex < 0 || inventoryIndex >= this.inventory.length) {
      return { success: false, message: "Invalid slot" };
    }

    const item = this.inventory[inventoryIndex];
    const player = this.scene.player;
    if (!player) return { success: false, message: "No player" };

    player.gold += item.sellPrice;

    if (item.count > 1) {
      item.count--;
    } else {
      this.inventory.splice(inventoryIndex, 1);
    }

    if (this.scene.game.audioSystem) {
      try { this.scene.game.audioSystem.playPickup(); } catch { /* ignore */ }
    }

    return { success: true, message: `Sold ${item.name} for ${item.sellPrice}g` };
  }

  applyConsumable(item) {
    const player = this.scene.player;
    if (!player) return;

    if (item.effect.heal) {
      player.heal(item.effect.heal);
    }
    if (item.effect.mana) {
      player.mana = Math.min(player.maxMana, player.mana + item.effect.mana);
    }
    if (item.effect.xp) {
      player.gainXP(item.effect.xp);
    }
  }

  useItem(inventoryIndex) {
    if (inventoryIndex < 0 || inventoryIndex >= this.inventory.length) return false;

    const item = this.inventory[inventoryIndex];
    if (item.type !== "consumable") return false;

    this.applyConsumable(item);

    if (item.count > 1) {
      item.count--;
    } else {
      this.inventory.splice(inventoryIndex, 1);
    }

    if (this.scene.game.audioSystem) {
      try { this.scene.game.audioSystem.playPickup(); } catch { /* ignore */ }
    }

    return true;
  }

  equipItem(item) {
    const slot = item.type;
    const player = this.scene.player;
    if (!player || !(slot in this.equipped)) return;

    this.equipped[slot] = item;
    this.applyEquipmentStats();
  }

  applyEquipmentStats() {
    const player = this.scene.player;
    if (!player) return;

    let bonusDamage = 0;
    let bonusReduction = 0;
    let bonusSpeed = 0;
    let bonusCrit = 0;
    let bonusMaxHP = 0;

    Object.values(this.equipped).forEach((item) => {
      if (!item) return;
      if (item.effect.attackDamage) bonusDamage += item.effect.attackDamage;
      if (item.effect.damageReduction) bonusReduction += item.effect.damageReduction;
      if (item.effect.speedBonus) bonusSpeed += item.effect.speedBonus;
      if (item.effect.critChance) bonusCrit += item.effect.critChance;
      if (item.effect.maxHealth) bonusMaxHP += item.effect.maxHealth;
    });

    const baseDamage = 35 + (player.level - 1) * 2;
    player.attackDamage = baseDamage + bonusDamage;
    player.damageReduction = Math.min(0.75, bonusReduction);
    player.critChance = 0.15 + bonusCrit;
    player.speed = Math.floor(300 * (1 + bonusSpeed));
    player.sprintSpeed = Math.floor(480 * (1 + bonusSpeed));

    if (bonusMaxHP > 0) {
      const oldMax = player.maxHealth;
      player.maxHealth = 100 + (player.level - 1) * 10 + bonusMaxHP;
      player.health += player.maxHealth - oldMax;
    }
  }

  getGold() {
    return this.scene.player ? this.scene.player.gold : 0;
  }

  getEquipped() {
    return this.equipped;
  }

  getInventory() {
    return this.inventory;
  }

  serialize() {
    return {
      inventory: this.inventory.map((i) => ({ id: i.id, count: i.count })),
      equipped: {
        weapon: this.equipped.weapon ? this.equipped.weapon.id : null,
        armor: this.equipped.armor ? this.equipped.armor.id : null,
        accessory: this.equipped.accessory ? this.equipped.accessory.id : null,
      },
    };
  }

  deserialize(data) {
    if (!data) return;
    if (data.inventory) {
      this.inventory = data.inventory.map((saved) => {
        const item = SHOP_ITEMS.find((i) => i.id === saved.id);
        return item ? { ...item, count: saved.count } : null;
      }).filter(Boolean);
    }
    if (data.equipped) {
      Object.entries(data.equipped).forEach(([slot, itemId]) => {
        if (itemId) {
          const item = SHOP_ITEMS.find((i) => i.id === itemId);
          if (item) this.equipped[slot] = item;
        }
      });
      this.applyEquipmentStats();
    }
  }
}
