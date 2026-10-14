import { defineItems } from "./items";

export const ITEMS = defineItems([
  {
    id: "wooden_sword",
    name: "Wooden Sword",
    rarity: "common",
    value: 5,
    stats: { damage: 2 },
  },
  {
    id: "iron_sword",
    name: "Iron Sword",
    rarity: "uncommon",
    value: 40,
    levelReq: 3,
    stats: { damage: 5, strength: 2 },
  },
  {
    id: "ruby_amulet",
    name: "Ruby Amulet",
    rarity: "rare",
    value: 150,
    levelReq: 8,
    description: "A warm glow pulses from within.",
    stats: { maxHealth: 50, healthRegenPercent: 1 },
  },
  {
    id: "crown_of_embers",
    name: "Crown of Embers",
    rarity: "legendary",
    value: 2500,
    levelReq: 20,
    description: "Forged in a fire that never went out.\nIt burns bright, and it burns the wearer.",
    stats: { damage: 25, critChance: 5, defence: -2 },
  },
]);