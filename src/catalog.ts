import type { Equipment } from "./equipment";
import {
  defineCatalog, shopsOf, slotAccepts,
  type CatalogEntry, type Item, type SlotId,
} from "./items";
import type { ShopId } from "./shops";

// ===== EVERYTHING that can be bought, owned, or applied lives here =====
// `shop` says where an entry is sold: "itemBases", "enhancements", "limited",
// or a list like ["enhancements", "limited"]. Leave it out for items that aren't sold anywhere.
// Shop tables list entries in the order written below (items, then enhancements, then expanders).
export const CATALOG = defineCatalog({
  items: [
    // ----- Basic Items -----
    {
      id: "basic_dagger", name: "Basic Dagger", type: "weapon",
      rarity: "common", value: 15, enhancementSlots: 1,
      stats: { damage: 12, attackSpeed: 100 },
      shop: "basicItems",
    },
    {
      id: "basic_sword", name: "Basic Sword", type: "weapon",
      rarity: "common", value: 15, enhancementSlots: 1,
      stats: { damage: 25 },
      shop: "basicItems",
    },
    {
      id: "basic_longsword", name: "Basic Longsword", type: "weapon",
      rarity: "common", value: 15, enhancementSlots: 1,
      stats: { damage: 55, attackSpeed: -100 },
      shop: "basicItems",
    },
    {
      id: "basic_helmet", name: "Basic Helmet", type: "helmet",
      rarity: "common", value: 10, enhancementSlots: 1,
      stats: { defence: 2 },
      shop: "basicItems",
    },
    {
      id: "basic_chestplate", name: "Basic Chestplate", type: "chestplate",
      rarity: "common", value: 20, enhancementSlots: 1,
      stats: { defence: 4 },
      shop: "basicItems",
    },
    {
      id: "basic_leggings", name: "Basic Leggings", type: "leggings",
      rarity: "common", value: 15, enhancementSlots: 1,
      stats: { defence: 3 },
      shop: "basicItems",
    },
    {
      id: "basic_boots", name: "Basic Boots", type: "boots",
      rarity: "common", value: 10, enhancementSlots: 1,
      stats: { defence: 2 },
      shop: "basicItems",
    },
    {
      id: "basic_heal", name: "Basic Healing Spell", type: "healing_spell",
      rarity: "common", value: 15, enhancementSlots: 0,
      manaCost: 15,
      stats: { healRaw: 50 },
      shop: "basicItems",
    },
    {
      id: "basic_damage", name: "Basic Damage Spell", type: "damage_spell",
      rarity: "common", value: 15, enhancementSlots: 1,
      manaCost: 35,
      stats: { damage: 50 },
      shop: "basicItems",
    },
    {
      id: "basic_ultimate", name: "Basic Ultimate Spell", type: "ultimate_spell",
      rarity: "common", value: 75, enhancementSlots: 1,
      manaCost: 75,
      stats: { damage: 250 },
      shop: "basicItems",
    },

    // ----- Weapons -----

    {
      id: "t1_dagger", name: "T1 Dagger", type: "weapon",
      rarity: "uncommon", value: 35, levelReq: 2, enhancementSlots: 2,
      stats: { damage: 20, attackSpeed: 100 },
      shop: "basicItems",
    },
    {
      id: "t1_sword", name: "T1 Sword", type: "weapon",
      rarity: "uncommon", value: 35, levelReq: 2, enhancementSlots: 2,
      stats: { damage: 50, strength: 10, critChance: 5, critDamage: 10 },
      shop: "basicItems",
    },
    {
      id: "t1_longsword", name: "T1 Longsword", type: "weapon",
      rarity: "uncommon", value: 35, levelReq: 2, enhancementSlots: 2,
      stats: { damage: 105, attackSpeed: -100 },
      shop: "basicItems",
    },
    {
      id: "t2_dagger", name: "T2 Dagger", type: "weapon",
      rarity: "rare", value: 75, levelReq: 6, enhancementSlots: 3,
      stats: { damage: 35, attackSpeed: 100 },
      shop: "basicItems",
    },
    {
      id: "t2_sword", name: "T2 Sword", type: "weapon",
      rarity: "rare", value: 75, levelReq: 6, enhancementSlots: 3,
      stats: { damage: 75, strength: 25, critChance: 10, critDamage: 40 },
      shop: "basicItems",
    },
    {
      id: "t2_longsword", name: "T2 Longsword", type: "weapon",
      rarity: "rare", value: 75, levelReq: 6, enhancementSlots: 3,
      stats: { damage: 155, attackSpeed: -100 },
      shop: "basicItems",
    },
    {
      id: "t3_dagger", name: "T3 Dagger", type: "weapon",
      rarity: "epic", value: 160, levelReq: 10, enhancementSlots: 4,
      stats: { damage: 45, attackSpeed: 100 },
      shop: "basicItems",
    },
    {
      id: "t3_sword", name: "T3 Sword", type: "weapon",
      rarity: "epic", value: 160, levelReq: 10, enhancementSlots: 4,
      stats: { damage: 100, strength: 50, critChance: 15, critDamage: 100 },
      shop: "basicItems",
    },
    {
      id: "t3_longsword", name: "T3 Longsword", type: "weapon",
      rarity: "epic", value: 160, levelReq: 10, enhancementSlots: 4,
      stats: { damage: 205, attackSpeed: -100 },
      shop: "basicItems",
    },

    // ----- Armour -----
    {
      id: "t1_helmet", name: "T1 Helmet", type: "helmet",
      rarity: "uncommon", value: 25, levelReq: 2, enhancementSlots: 2,
      stats: { maxHealth: 25, defence : 5 },
      shop: "basicItems",
    },
    {
      id: "t2_helmet", name: "T2 Helmet", type: "helmet",
      rarity: "rare", value: 60, levelReq: 6, enhancementSlots: 3,
      stats: { maxHealth: 50, defence : 10 },
      shop: "basicItems",
    },
    {
      id: "t3_helmet", name: "T3 Helmet", type: "helmet",
      rarity: "epic", value: 110, levelReq: 10, enhancementSlots: 4,
      stats: { maxHealth: 80, defence : 15 },
      shop: "basicItems",
    },
    {
      id: "t1_chestplate", name: "T1 Chestplate", type: "chestplate",
      rarity: "uncommon", value: 40, levelReq: 2, enhancementSlots: 2,
      stats: { maxHealth: 40, defence : 7 },
      shop: "basicItems",
    },
    {
      id: "t2_chestplate", name: "T2 Chestplate", type: "chestplate",
      rarity: "rare", value: 90, levelReq: 6, enhancementSlots: 3,
      stats: { maxHealth: 75, defence : 15 },
      shop: "basicItems",
    },
    {
      id: "t3_chestplate", name: "T3 Chestplate", type: "chestplate",
      rarity: "epic", value: 175, levelReq: 10, enhancementSlots: 4,
      stats: { maxHealth: 125, defence : 25 },
      shop: "basicItems",
    },
    {
      id: "t1_leggings", name: "T1 Leggings", type: "leggings",
      rarity: "uncommon", value: 30, levelReq: 2, enhancementSlots: 2,
      stats: { maxHealth: 35, defence : 6 },
      shop: "basicItems",
    },
    {
      id: "t2_leggings", name: "T2 Leggings", type: "leggings",
      rarity: "rare", value: 75, levelReq: 6, enhancementSlots: 3,
      stats: { maxHealth: 65, defence : 12 },
      shop: "basicItems",
    },
    {
      id: "t3_leggings", name: "T3 Leggings", type: "leggings",
      rarity: "epic", value: 150, levelReq: 10, enhancementSlots: 4,
      stats: { maxHealth: 100, defence : 20 },
      shop: "basicItems",
    },
    {
      id: "t1_boots", name: "T1 Boots", type: "boots",
      rarity: "uncommon", value: 25, levelReq: 2, enhancementSlots: 2,
      stats: { maxHealth: 25, defence : 5 },
      shop: "basicItems",
    },
    {
      id: "t2_boots", name: "T2 Boots", type: "boots",
      rarity: "rare", value: 60, levelReq: 6, enhancementSlots: 3,
      stats: { maxHealth: 50, defence : 10 },
      shop: "basicItems",
    },
    {
      id: "t3_boots", name: "T3 Boots", type: "boots",
      rarity: "epic", value: 110, levelReq: 10, enhancementSlots: 4,
      stats: { maxHealth: 80, defence : 15 },
      shop: "basicItems",
    },

    // ----- Spells -----
    {
      id: "t1_heal", name: "T1 Healing Spell", type: "healing_spell",
      rarity: "uncommon", value: 30, levelReq: 2, enhancementSlots: 0,
      manaCost: 20,
      stats: { healRaw: 100 },
      shop: "basicItems",
    },
    {
      id: "t2_heal", name: "T2 Healing Spell", type: "healing_spell",
      rarity: "rare", value: 75, levelReq: 6, enhancementSlots: 0,
      manaCost: 30,
      stats: { healRaw: 250, healPercent: 2.5 },
      shop: "basicItems",
    },
    {
      id: "t3_heal", name: "T3 Healing Spell", type: "healing_spell",
      rarity: "epic", value: 150, levelReq: 10, enhancementSlots: 0,
      manaCost: 45,
      stats: { healRaw: 500, healPercent: 5 },
      shop: "basicItems",
    },
    {
      id: "t1_damage", name: "T1 Damage Spell", type: "damage_spell",
      rarity: "uncommon", value: 35, levelReq: 2, enhancementSlots: 2,
      manaCost: 40,
      stats: { damage: 100 },
      shop: "basicItems",
    },
    {
      id: "t2_damage", name: "T2 Damage Spell", type: "damage_spell",
      rarity: "rare", value: 75, levelReq: 6, enhancementSlots: 3,
      manaCost: 45,
      stats: { damage: 150 },
      shop: "basicItems",
    },
    {
      id: "t3_damage", name: "T3 Damage Spell", type: "damage_spell",
      rarity: "epic", value: 160, levelReq: 10, enhancementSlots: 4,
      manaCost: 50,
      stats: { damage: 200 },
      shop: "basicItems",
    },
    {
      id: "t1_ultimate", name: "T1 Ultimate Spell", type: "ultimate_spell",
      rarity: "uncommon", value: 150, levelReq: 2, enhancementSlots: 2,
      manaCost: 100,
      stats: { damage: 500 },
      shop: "basicItems",
    },
    {
      id: "t2_ultimate", name: "T2 Ultimate Spell", type: "ultimate_spell",
      rarity: "rare", value: 250, levelReq: 6, enhancementSlots: 3,
      manaCost: 125,
      stats: { damage: 1000 },
      shop: "basicItems",
    },
    {
      id: "t3_ultimate", name: "T3 Ultimate Spell", type: "ultimate_spell",
      rarity: "epic", value: 400, levelReq: 10, enhancementSlots: 4,
      manaCost: 150,
      stats: { damage: 2000 },
      shop: "basicItems",
    },

      // ----- Limited item bases (sold in the Limited! shop) -----
    {
      id: "t4_dagger", name: "T4 Dagger", type: "weapon",
      rarity: "epic", value: 300, levelReq: 14, enhancementSlots: 5,
      stats: { damage: 65, attackSpeed: 100 },
      shop: "basicItems",
    },
    {
      id: "t4_sword", name: "T4 Sword", type: "weapon",
      rarity: "legendary", value: 300, levelReq: 14, enhancementSlots: 5,
      stats: { damage: 150, strength: 100, critChance: 25, critDamage: 150 },
      shop: "limited",
    },
    {
      id: "t4_longsword", name: "T4 Longsword", type: "weapon",
      rarity: "legendary", value: 300, levelReq: 14, enhancementSlots: 5,
      stats: { damage: 310, attackSpeed: -100 },
      shop: "limited",
    },
    {
      id: "t4_helmet", name: "T4 Helmet", type: "helmet",
      rarity: "legendary", value: 200, levelReq: 14, enhancementSlots: 5,
      stats: { maxHealth: 125, defence : 35, strength: 25 },
      shop: "limited",
    },
    {
      id: "t4_chestplate", name: "T4 Chestplate", type: "chestplate",
      rarity: "legendary", value: 350, levelReq: 14, enhancementSlots: 5,
      stats: { maxHealth: 180, defence : 60, critDamage: 25 },
      shop: "limited",
    },
    {
      id: "t4_leggings", name: "T4 Leggings", type: "leggings",
      rarity: "legendary", value: 275, levelReq: 14, enhancementSlots: 5,
      stats: { maxHealth: 150, defence : 45, critChance: 10 },
      shop: "limited",
    },
    {
      id: "t4_boots", name: "T4 Boots", type: "boots",
      rarity: "legendary", value: 200, levelReq: 10, enhancementSlots: 5,
      stats: { maxHealth: 125, defence : 35, strength: 10, critDamage: 15 },
      shop: "limited",
    },
  ],

  enhancements: [
    {
      id: "strength", name: "Strength", 
      rarity: "common", value: 15,
      stats: { strength: 10 },
      shop: "enhancements",
    },
    {
      id: "defence", name: "Defence", 
      rarity: "common", value: 15,
      stats: { defence: 10 },
      shop: "enhancements",
    },
    {
      id: "critical", name: "Critical", 
      rarity: "common", value: 15,
      stats: { critChance: 1, critDamage: 5 },
      shop: "enhancements",
    },
    {
      id: "medic", name: "Medic", 
      rarity: "common", value: 15,
      stats: { maxHealth: 50, healthRegenRaw: 5 },
      shop: "enhancements",
    },
    {
      id: "mana", name: "Wizard", 
      rarity: "common", value: 15,
      stats: { maxMana: 5, manaRegenRaw: 1 },
      shop: "enhancements",
    },
    {
      id: "scavenger", name: "Scavenger", 
      rarity: "common", value: 20,
      stats: { coinGain : 1 },
      shop: "enhancements",
    },
    {
      id: "attackspeed", name: "Swinger", 
      rarity: "common", value: 20,
      stats: { attackSpeed : 10 },
      shop: "enhancements",
    },
    {
      id: "berserker", name: "Berserker", 
      rarity: "uncommon", value: 40,
      stats: { strength: 25, critChance: 2.5, critDamage: 15, attackSpeed: 5 },
      shop: "enhancements",
    },
    {
      id: "tank", name: "Tank", 
      rarity: "uncommon", value: 35,
      stats: { defence: 25, maxHealth: 100, healthRegenRaw: 15, healthRegenPercent: 0.5 },
      shop: "enhancements",
    },
    {
      id: "healer", name: "Healer", 
      rarity: "uncommon", value: 35,
      stats: { maxHealth: 250, healthRegenRaw: 25, healthRegenPercent: 1 },
      shop: "enhancements",
    },
    {
      id: "mage", name: "Mage", 
      rarity: "uncommon", value: 35,
      stats: { maxMana: 15, manaRegenRaw: 3, manaRegenPercent: 1 },
      shop: "enhancements",
    },
    {
      id: "balanced", name: "Balanced", 
      rarity: "uncommon", value: 40,
      stats: { strength: 10, critDamage: 10, defence: 10, coinGain: 1, attackSpeed: 5 },
      shop: "enhancements",
    },
    {
      id: "wealthy", name: "Wealthy", 
      rarity: "uncommon", value: 60,
      stats: { strength: -10, critDamage: -10, defence: -10, coinGain : 4 },
      shop: "enhancements",
    },
    {
      id: "speedrun", name: "Speedrunning", 
      rarity: "uncommon", value: 60,
      stats: { attackSpeed : 25 },
      shop: "enhancements",
    },

    // ----- Limited enhancements (sold in the Limited! shop) -----
    {
      id: "glass_cannon", name: "Glass Cannon", 
      rarity: "rare", value: 75,
      stats: { strength: 60, critChance: 5, critDamage: 35, defence: -50 },
      shop: "limited",
    },
    {
      id: "shielded", name: "Shielded", 
      rarity: "rare", value: 75,
      stats: { strength: -20, critDamage: -20, defence: 100, maxHealth: 500 },
      shop: "limited",
    },
    {
      id: "stubborn", name: "Stubbornness", 
      rarity: "rare", value: 75,
      stats: { maxHealth: 1000, healthRegenRaw: 100, healthRegenPercent: 2.5, manaRegenRaw: -50, strength: -50, critDamage: -50 },
      shop: "limited",
    },
    {
      id: "ning", name: "Ninja", 
      rarity: "rare", value: 75,
      stats: { maxMana: 50, manaRegenRaw: 10, manaRegenPercent: 2.5, strength: -50, critDamage: -50 },
      shop: "limited",
    },
    {
      id: "um_class", name: "I'm Upper Middle Class", 
      rarity: "rare", value: 125,
      stats: { strength: 25, critChance: 10, critDamage: 25, coinGain : 5 },
      shop: "enhancements",
    },
    {
      id: "rush", name: "Rush", 
      rarity: "rare", value: 100,
      stats: { strength: 10, critDamage: 10, attackSpeed: 25, defence: -25 },
      shop: "enhancements",
    },
    {
      id: "brittle", name: "Glass Cannon++", 
      rarity: "epic", value: 150,
      stats: { strength: 100, critChance: 15, critDamage: 75, defence: -100, maxHealth: -250, healthRegenRaw: -25, healthRegenPercent: -1 },
      shop: "limited",
    },
    {
      id: "academic_weapon", name: "Academic Weapon", 
      rarity: "epic", value: 150,
      stats: { maxMana: 100, manaRegenRaw: 15, manaRegenPercent: 5 },
      shop: "limited",
    },
    {
      id: "academic_victim", name: "Academic Victim", 
      rarity: "epic", value: 150,
      stats: { maxMana: -100, manaRegenRaw: -15, manaRegenPercent: -5 },
      shop: "limited",
    },
    {
      id: "elon", name: "Elon Musk", 
      rarity: "epic", value: 200,
      stats: { strength: -50, critDamage: -50, defence: -50, coinGain : 12 },
      shop: "enhancements",
    },
    {
      id: "maximum", name: "Maximum", 
      rarity: "epic", value: 225,
      stats: { strength: 100, critChance: 25, critDamage: 100, attackSpeed: 100, defence: -250, healthRegenRaw: -100 },
      shop: "enhancements",
    },
  ],

  expanders: [
    {
      id: "t1_expander", name: "Expander +1", rarity: "rare", value: 100, slots: 1, levelReq: 3,
      description: "Adds 1 enhancement slot",
      shop: "enhancements",
    },
    {
      id: "t2_expander", name: "Expander +2", rarity: "epic", value: 250, slots: 2, levelReq: 8,
      description: "Adds 2 enhancement slots",
      shop: "enhancements",
    },
    {
      id: "t3_expander", name: "Expander +3", rarity: "legendary", value: 450, slots: 3, levelReq: 13,
      description: "Adds 3 enhancement slots",
      shop: "enhancements",
    },
  ],
});

// ===== Lookups, built from the list above =====
function byKind<K extends CatalogEntry["kind"]>(kind: K) {
  const out: Record<string, Extract<CatalogEntry, { kind: K }>> = {};
  for (const e of CATALOG) {
    if (e.kind === kind) out[e.id] = e as Extract<CatalogEntry, { kind: K }>;
  }
  return out;
}

export const ITEMS = byKind("item");
export const ENHANCEMENTS = byKind("enhancement");
export const EXPANDERS = byKind("expander");

export const CATALOG_BY_ID: Record<string, CatalogEntry> = Object.fromEntries(
  CATALOG.map((e) => [e.id, e])
);

// What a shop sells, in catalog order
export const entriesForShop = (shopId: ShopId): CatalogEntry[] =>
  CATALOG.filter((e) => shopsOf(e).includes(shopId));

// The item a player has in `slot`, if it's valid for that slot (used everywhere gear is read)
export function getEquippedItem(
  equipment: Equipment | null | undefined,
  slot: SlotId
): Item | undefined {
  const item = ITEMS[equipment?.[slot] ?? ""];
  return item && slotAccepts(slot, item.type) ? item : undefined;
}