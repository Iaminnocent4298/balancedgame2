import { ITEM_MODIFIABLE_FIELDS } from "./stats";
import type { ItemStats, RarityId } from "./items";

// Bought in the shop and applied to a piece of gear or a spell.
export type Enhancement = {
  id: string; // unique and permanent
  name: string;
  rarity: RarityId;
  value: number; // default shop price
  description?: string;
  stats?: ItemStats; // added to your totals while the enhanced item is equipped
  levelReq?: number; // minimum level to buy it. Omit if it has none
};

export function defineEnhancements(list: Enhancement[]): Record<string, Enhancement> {
  const out: Record<string, Enhancement> = {};
  for (const e of list) {
    if (e.id in out) throw new Error(`Duplicate enhancement id: ${e.id}`);
    if (!(e.value >= 0)) throw new Error(`Enhancement "${e.id}" needs a value of 0 or more`);
    if (e.levelReq !== undefined && !(e.levelReq >= 1)) {
      throw new Error(`Enhancement "${e.id}" has an invalid levelReq`);
    }
    for (const key of Object.keys(e.stats ?? {})) {
      if (!ITEM_MODIFIABLE_FIELDS.includes(key)) {
        throw new Error(`Enhancement "${e.id}" can't modify "${key}"`);
      }
    }
    out[e.id] = e;
  }
  return out;
}