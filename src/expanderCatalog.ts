import type { RarityId } from "./items";

// Bought in the shop and applied to one piece of gear or spell: adds enhancement slots to it.
export type Expander = {
  id: string; // unique and permanent
  name: string;
  rarity: RarityId;
  value: number; // default shop price
  slots: number; // how many enhancement slots it adds (a whole number, 1 or more)
  description?: string;
  levelReq?: number; // minimum level to buy it. Omit if it has none
};

export function defineExpanders(list: Expander[]): Record<string, Expander> {
  const out: Record<string, Expander> = {};
  for (const e of list) {
    if (e.id in out) throw new Error(`Duplicate expander id: ${e.id}`);
    if (!(e.value >= 0)) throw new Error(`Expander "${e.id}" needs a value of 0 or more`);
    if (!(Number.isInteger(e.slots) && e.slots >= 1)) {
      throw new Error(`Expander "${e.id}" needs a whole number of slots (1 or more)`);
    }
    if (e.levelReq !== undefined && !(e.levelReq >= 1)) {
      throw new Error(`Expander "${e.id}" has an invalid levelReq`);
    }
    out[e.id] = e;
  }
  return out;
}

export const EXPANDERS = defineExpanders([
  {
    id: "minor_expander", name: "Minor Expander", rarity: "uncommon", value: 60, slots: 1,
    description: "A little extra room to work with.",
  },
  {
    id: "expander", name: "Expander", rarity: "rare", value: 150, slots: 2, levelReq: 5,
  },
  {
    id: "grand_expander", name: "Grand Expander", rarity: "epic", value: 350, slots: 3, levelReq: 10,
    description: "Carves out space where there was none.",
  },
]);