import { defineEnhancements } from "./enhancements";

export const ENHANCEMENTS = defineEnhancements([
  { id: "sharpness", name: "Sharpness", rarity: "common", value: 15,
    description: "Hone the edge.", stats: { damage: 2 } },
  { id: "fortify", name: "Fortify", rarity: "common", value: 15,
    description: "Reinforced where it counts.", stats: { defence: 2 } },
  { id: "vitality", name: "Vitality", rarity: "uncommon", value: 30,
    stats: { maxHealth: 15 } },
  { id: "arcane_focus", name: "Arcane Focus", rarity: "uncommon", value: 30,
    stats: { maxMana: 15 } },
  { id: "keen_edge", name: "Keen Edge", rarity: "rare", value: 80,
    stats: { critChance: 1, critDamage: 5 } },
  { id: "empower", name: "Empower", rarity: "rare", value: 80,
    description: "Raw power, bottled.", stats: { strength: 3 } },

  // ----- Limited enhancements (sold in the Limited! shop) -----
  { id: "razor_edge", name: "Razor Edge", rarity: "epic", value: 150,
    description: "Sharp enough to cut a thought in half.", stats: { damage: 5 } },
  { id: "bulwark", name: "Bulwark", rarity: "epic", value: 150,
    stats: { defence: 5 } },
  { id: "titan_heart", name: "Titan's Heart", rarity: "epic", value: 180,
    stats: { maxHealth: 40 } },
  { id: "deep_wellspring", name: "Deep Wellspring", rarity: "epic", value: 180,
    stats: { maxMana: 40 } },
  { id: "deadeye", name: "Deadeye", rarity: "legendary", value: 300,
    description: "Never misses a weak point.", stats: { critChance: 3, critDamage: 15 } },
  { id: "berserkers_rage", name: "Berserker's Rage", rarity: "legendary", value: 300,
    description: "Power, at the cost of caution.", stats: { strength: 6, damage: 3, defence: -2 } },
]);