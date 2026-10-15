import { COMPOSITE_FIELDS } from "./stats";

// ===== Rarities: ordered lowest to highest. Add or rename here. =====
export const RARITIES = [
  { id: "common", label: "Common" },
  { id: "uncommon", label: "Uncommon" },
  { id: "rare", label: "Rare" },
  { id: "epic", label: "Epic" },
  { id: "legendary", label: "Legendary" },
  { id: "mythic", label: "Mythic" },
] as const;
export type RarityId = (typeof RARITIES)[number]["id"];

export const getRarity = (id: RarityId) => RARITIES.find((r) => r.id === id)!;
export const rarityRank = (id: RarityId) => RARITIES.findIndex((r) => r.id === id); // for sorting

// ===== Item types. Each equipment slot uses one of these. =====
export const ITEM_TYPES = [
  { id: "weapon", label: "Weapon" },
  { id: "helmet", label: "Helmet" },
  { id: "chestplate", label: "Chestplate" },
  { id: "leggings", label: "Leggings" },
  { id: "boots", label: "Boots" },
  { id: "healing_spell", label: "Healing Spell" },
  { id: "damage_spell", label: "Damage Spell" },
  { id: "aoe_spell", label: "AOE Spell" },
  { id: "ultimate_spell", label: "Ultimate Spell" },
] as const;
export type ItemTypeId = (typeof ITEM_TYPES)[number]["id"];

export const getItemType = (id: ItemTypeId) => ITEM_TYPES.find((t) => t.id === id)!;

// ===== The item type. New attributes go here (make them optional). =====
// Keys are stored stat field names from stats.ts, e.g. { damage: 5, maxHealth: 50 }.
// Values can be negative. Stats not listed are unaffected.
export type ItemStats = Record<string, number>;

export type Item = {
  id: string;
  name: string;
  type: ItemTypeId; // which slot or menu the item belongs to
  rarity: RarityId;
  value: number;
  levelReq?: number;
  description?: string;
  stats?: ItemStats;
  enhancementSlots?: number; // how many enhancements it can hold. Omit for the default (3)
};

// Builds a lookup by id and catches mistakes as soon as the app loads
export function defineItems(list: Item[]): Record<string, Item> {
  const out: Record<string, Item> = {};
  for (const item of list) {
    if (item.id in out) throw new Error(`Duplicate item id: ${item.id}`);
    if (!ITEM_TYPES.some((t) => t.id === item.type)) {
      throw new Error(`Item "${item.id}" has an unknown type "${item.type}"`);
    }
    if (!(item.value >= 0)) throw new Error(`Item "${item.id}" needs a value of 0 or more`);
    if (item.levelReq !== undefined && !(item.levelReq >= 1)) {
      throw new Error(`Item "${item.id}" has an invalid levelReq`);
    }
    if (
      item.enhancementSlots !== undefined &&
      !(Number.isInteger(item.enhancementSlots) && item.enhancementSlots >= 0)
    ) {
      throw new Error(`Item "${item.id}" has an invalid enhancementSlots`);
    }
    for (const key of Object.keys(item.stats ?? {})) {
      if (!COMPOSITE_FIELDS.includes(key)) {
        throw new Error(`Item "${item.id}" can't modify "${key}" (unknown or not modifiable)`);
      }
    }
    out[item.id] = item;
  }
  return out;
}

// ===== Salvaging =====
export const SALVAGE_RATE = 0.5; // 50% of an item's value
export const getSalvageValue = (item: Item) => Math.floor(item.value * SALVAGE_RATE);

// ===== Enhancement slots =====
export const DEFAULT_ENHANCEMENT_SLOTS = 3;
export const getMaxEnhancements = (item: Item) =>
  item.enhancementSlots ?? DEFAULT_ENHANCEMENT_SLOTS;