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
    id: "t1_expander", name: "Expander +1", rarity: "rare", value: 100, slots: 1, levelReq: 3,
    description: "Adds 1 enhancement slot"
  },
  {
    id: "t2_expander", name: "Expander +2", rarity: "epic", value: 250, slots: 2, levelReq: 8,
    description: "Adds 2 enhancement slots"
  },
  {
    id: "t3_expander", name: "Expander +3", rarity: "legendary", value: 500, slots: 3, levelReq: 13,
    description: "Adds 3 enhancement slots",
  },
]);