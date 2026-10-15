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
]);