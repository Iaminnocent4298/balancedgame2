import { defineItems } from "./items";

export const ITEMS = defineItems([
  // ----- Weapons -----
  {
    id: "t1_sword", name: "T1 Sword", type: "weapon",
    rarity: "uncommon", value: 35, levelReq: 2, enhancementSlots: 2,
    stats: { damage: 50, strength: 10, critChance: 5, critDamage: 10 },
  },
  {
    id: "t2_sword", name: "T2 Sword", type: "weapon",
    rarity: "rare", value: 75, levelReq: 6, enhancementSlots: 3,
    stats: { damage: 75, strength: 25, critChance: 10, critDamage: 40 },
  },
  {
    id: "t3_sword", name: "T3 Sword", type: "weapon",
    rarity: "epic", value: 160, levelReq: 10, enhancementSlots: 4,
    stats: { damage: 100, strength: 50, critChance: 15, critDamage: 100 },
  },

  // ----- Armour -----
  {
    id: "t1_helmet", name: "T1 Helmet", type: "helmet",
    rarity: "uncommon", value: 25, levelReq: 2, enhancementSlots: 2,
    stats: { maxHealth: 25, defence : 5 },
  },
  {
    id: "t2_helmet", name: "T2 Helmet", type: "helmet",
    rarity: "rare", value: 60, levelReq: 6, enhancementSlots: 3,
    stats: { maxHealth: 50, defence : 10 },
  },
  {
    id: "t3_helmet", name: "T3 Helmet", type: "helmet",
    rarity: "epic", value: 110, levelReq: 10, enhancementSlots: 4,
    stats: { maxHealth: 80, defence : 15 },
  },
  {
    id: "t1_chestplate", name: "T1 Chestplate", type: "chestplate",
    rarity: "uncommon", value: 40, levelReq: 2, enhancementSlots: 2,
    stats: { maxHealth: 40, defence : 7 },
  },
  {
    id: "t2_chestplate", name: "T2 Chestplate", type: "chestplate",
    rarity: "rare", value: 90, levelReq: 6, enhancementSlots: 3,
    stats: { maxHealth: 75, defence : 15 },
  },
  {
    id: "t3_chestplate", name: "T3 Chestplate", type: "chestplate",
    rarity: "epic", value: 175, levelReq: 10, enhancementSlots: 4,
    stats: { maxHealth: 125, defence : 25 },
  },
  {
    id: "t1_leggings", name: "T1 Leggings", type: "leggings",
    rarity: "uncommon", value: 30, levelReq: 2, enhancementSlots: 2,
    stats: { maxHealth: 35, defence : 6 },
  },
  {
    id: "t2_leggings", name: "T2 Leggings", type: "leggings",
    rarity: "rare", value: 75, levelReq: 6, enhancementSlots: 3,
    stats: { maxHealth: 65, defence : 12 },
  },
  {
    id: "t3_leggings", name: "T3 Leggings", type: "leggings",
    rarity: "epic", value: 150, levelReq: 10, enhancementSlots: 4,
    stats: { maxHealth: 100, defence : 20 },
  },
  {
    id: "t1_boots", name: "T1 Boots", type: "boots",
    rarity: "uncommon", value: 25, levelReq: 2, enhancementSlots: 2,
    stats: { maxHealth: 25, defence : 5 },
  },
  {
    id: "t2_boots", name: "T2 Boots", type: "boots",
    rarity: "rare", value: 60, levelReq: 6, enhancementSlots: 3,
    stats: { maxHealth: 50, defence : 10 },
  },
  {
    id: "t3_boots", name: "T3 Boots", type: "boots",
    rarity: "epic", value: 110, levelReq: 10, enhancementSlots: 4,
    stats: { maxHealth: 80, defence : 15 },
  },

  // ----- Spells -----
  {
    id: "t1_heal", name: "T1 Healing Spell", type: "healing_spell",
    rarity: "uncommon", value: 30, levelReq: 2, enhancementSlots: 0,
    manaCost: 20,
    stats: { healRaw: 100 },
  },
  {
    id: "t2_heal", name: "T2 Healing Spell", type: "healing_spell",
    rarity: "rare", value: 75, levelReq: 6, enhancementSlots: 0,
    manaCost: 30,
    stats: { healRaw: 250, healPercent: 2.5 },
  },
  {
    id: "t3_heal", name: "T3 Healing Spell", type: "healing_spell",
    rarity: "epic", value: 150, levelReq: 10, enhancementSlots: 0,
    manaCost: 45,
    stats: { healRaw: 500, healPercent: 5 },
  },
  {
    id: "t1_damage", name: "T1 Damage Spell", type: "damage_spell",
    rarity: "uncommon", value: 35, levelReq: 2, enhancementSlots: 2,
    manaCost: 40,
    stats: { damage: 100 },
  },
  {
    id: "t2_damage", name: "T2 Damage Spell", type: "damage_spell",
    rarity: "rare", value: 75, levelReq: 6, enhancementSlots: 3,
    manaCost: 45,
    stats: { damage: 150 },
  },
  {
    id: "t3_damage", name: "T3 Damage Spell", type: "damage_spell",
    rarity: "epic", value: 160, levelReq: 10, enhancementSlots: 4,
    manaCost: 50,
    stats: { damage: 200 },
  },
  {
    id: "t1_ultimate", name: "T1 Ultimate Spell", type: "ultimate_spell",
    rarity: "uncommon", value: 150, levelReq: 2, enhancementSlots: 2,
    manaCost: 100,
    stats: { damage: 500 },
  },
  {
    id: "t2_ultimate", name: "T2 Ultimate Spell", type: "ultimate_spell",
    rarity: "rare", value: 250, levelReq: 6, enhancementSlots: 3,
    manaCost: 125,
    stats: { damage: 1000 },
  },
  {
    id: "t3_ultimate", name: "T3 Ultimate Spell", type: "ultimate_spell",
    rarity: "epic", value: 400, levelReq: 10, enhancementSlots: 4,
    manaCost: 150,
    stats: { damage: 2000 },
  },

  // ----- Basic Items -----
  {
    id: "basic_weapon", name: "Basic Weapon", type: "weapon",
    rarity: "common", value: 15, enhancementSlots: 1,
    stats: { damage: 25 },
  },
  {
    id: "basic_helmet", name: "Basic Helmet", type: "helmet",
    rarity: "common", value: 10, enhancementSlots: 1,
    stats: { defence: 2 },
  },
  {
    id: "basic_chestplate", name: "Basic Chestplate", type: "chestplate",
    rarity: "common", value: 20, enhancementSlots: 1,
    stats: { defence: 4 },
  },
  {
    id: "basic_leggings", name: "Basic Leggings", type: "leggings",
    rarity: "common", value: 15, enhancementSlots: 1,
    stats: { defence: 3 },
  },
  {
    id: "basic_boots", name: "Basic Boots", type: "boots",
    rarity: "common", value: 10, enhancementSlots: 1,
    stats: { defence: 2 },
  },
  {
    id: "basic_heal", name: "Basic Healing Spell", type: "healing_spell",
    rarity: "common", value: 15, enhancementSlots: 0,
    manaCost: 15,
    stats: { healRaw: 50 },
  },
  {
    id: "basic_damage", name: "Basic Damage Spell", type: "damage_spell",
    rarity: "common", value: 15, enhancementSlots: 1,
    manaCost: 35,
    stats: { damage: 50 },
  },
  {
    id: "basic_ultimate", name: "Basic Ultimate Spell", type: "ultimate_spell",
    rarity: "common", value: 75, enhancementSlots: 1,
    manaCost: 75,
    stats: { damage: 250 },
  },

    // ----- Limited item bases (sold in the Limited! shop) -----
  {
    id: "t4_sword", name: "T4 Sword", type: "weapon",
    rarity: "epic", value: 300, levelReq: 14, enhancementSlots: 5,
    stats: { damage: 150, strength: 100, critChance: 25, critDamage: 150 },
  },
  {
    id: "t4_helmet", name: "T4 Helmet", type: "helmet",
    rarity: "epic", value: 200, levelReq: 14, enhancementSlots: 4,
    stats: { maxHealth: 125, defence : 35, strength: 25 },
  },
  {
    id: "t4_chestplate", name: "T4 Chestplate", type: "chestplate",
    rarity: "epic", value: 350, levelReq: 14, enhancementSlots: 4,
    stats: { maxHealth: 180, defence : 60, critDamage: 25 },
  },
  {
    id: "t4_leggings", name: "T4 Leggings", type: "leggings",
    rarity: "epic", value: 275, levelReq: 14, enhancementSlots: 4,
    stats: { maxHealth: 150, defence : 45, critChance: 10 },
  },
  {
    id: "t4_boots", name: "T4 Boots", type: "boots",
    rarity: "epic", value: 200, levelReq: 10, enhancementSlots: 4,
    stats: { maxHealth: 125, defence : 35, strength: 10, critDamage: 15 },
  },
]);