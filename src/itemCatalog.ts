import { defineItems } from "./items";

export const ITEMS = defineItems([
  // ----- Weapons -----
  {
    id: "iron_sword", name: "Iron Sword", type: "weapon",
    rarity: "uncommon", value: 40, levelReq: 3, enhancementSlots: 3,
    stats: { damage: 5, strength: 2 },
  },

  // ----- Armour -----
  {
    id: "ruby_helm", name: "Ruby Helm", type: "helmet",
    rarity: "rare", value: 150, levelReq: 8, enhancementSlots: 3,
    description: "A warm glow pulses from within.",
    stats: { maxHealth: 50, healthRegenPercent: 1 },
  },

  // ----- Spells -----
  {
    id: "minor_heal", name: "Minor Heal", type: "healing_spell",
    rarity: "common", value: 20, enhancementSlots: 2,
    description: "Restores a small amount of health.",
    manaCost: 10,
    stats: { healRaw: 5 },
  },
  {
    id: "fireball", name: "Fireball", type: "damage_spell",
    rarity: "uncommon", value: 75, levelReq: 5, enhancementSlots: 3,
    description: "Hurls a ball of fire at one target.",
    manaCost: 10,
    stats: { damage: 8 },
  },

  // ----- Item bases (sold in the Item Bases shop) -----
  {
    id: "weapon_base", name: "Crude Weapon", type: "weapon",
    rarity: "common", value: 10, enhancementSlots: 1,
    description: "Barely a weapon. It will need serious upgrading.",
    stats: { damage: 1 },
  },

    // ----- Limited item bases (sold in the Limited! shop) -----
  {
    id: "tempered_blade", name: "Tempered Blade", type: "weapon",
    rarity: "rare", value: 90, enhancementSlots: 4,
    description: "A proper blade, folded and quenched.",
    stats: { damage: 4, strength: 1 },
    levelReq: 3,
  },
  {
    id: "warden_helm", name: "Warden's Helm", type: "helmet",
    rarity: "rare", value: 80, enhancementSlots: 4,
    stats: { defence: 3, maxHealth: 10 },
    levelReq: 4,
  },
  {
    id: "warden_plate", name: "Warden's Plate", type: "chestplate",
    rarity: "rare", value: 110, enhancementSlots: 4,
    stats: { defence: 5, maxHealth: 20 },
    levelReq: 5,
  },
  {
    id: "warden_boots", name: "Warden's Boots", type: "boots",
    rarity: "rare", value: 80, enhancementSlots: 4,
    stats: { defence: 3, maxHealth: 8 },
    levelReq: 4,
  },
  {
    id: "greater_heal", name: "Greater Heal", type: "healing_spell",
    rarity: "rare", value: 100, enhancementSlots: 4,
    manaCost: 40,
    description: "A steady, reliable mending.",
  },
  {
    id: "arc_bolt", name: "Arc Bolt", type: "damage_spell",
    rarity: "rare", value: 100, enhancementSlots: 4,
    description: "Lightning, aimed.",
    manaCost: 60,
    stats: { damage: 10 },
  },
]);