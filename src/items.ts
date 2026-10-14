import { DEFAULT_STATS } from "./stats";

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

// ===== The item type. New attributes go here (make them optional). =====
// Keys are stored stat field names from stats.ts, e.g. { damage: 5, maxHealth: 50 }.
// Values can be negative. Stats not listed are unaffected.
export type ItemStats = Record<string, number>;

export type Item = {
  id: string; // unique and permanent, e.g. "iron_sword"
  name: string;
  rarity: RarityId;
  value: number; // in coins
  levelReq?: number; // omit if the item has no level requirement
  description?: string; // lore. Omit if none
  stats?: ItemStats; // omit if the item doesn't change any stats
};

// Builds a lookup by id and catches mistakes as soon as the app loads
export function defineItems(list: Item[]): Record<string, Item> {
  const out: Record<string, Item> = {};
  for (const item of list) {
    if (item.id in out) throw new Error(`Duplicate item id: ${item.id}`);
    if (!(item.value >= 0)) throw new Error(`Item "${item.id}" needs a value of 0 or more`);
    if (item.levelReq !== undefined && !(item.levelReq >= 1)) {
      throw new Error(`Item "${item.id}" has an invalid levelReq`);
    }
    for (const key of Object.keys(item.stats ?? {})) {
      if (!(key in DEFAULT_STATS)) {
        throw new Error(`Item "${item.id}" affects unknown stat "${key}"`);
      }
    }
    out[item.id] = item;
  }
  return out;
}