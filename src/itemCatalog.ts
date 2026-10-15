import { defineItems } from "./items";

export const ITEMS = defineItems([
  // ----- Weapons -----
  {
    id: "wooden_sword", name: "Wooden Sword", type: "weapon",
    rarity: "common", value: 5,
    stats: { damage: 2 },
  },
  {
    id: "iron_sword", name: "Iron Sword", type: "weapon",
    rarity: "uncommon", value: 40, levelReq: 3,
    stats: { damage: 5, strength: 2 },
  },

  // ----- Armour -----
  {
    id: "ruby_helm", name: "Ruby Helm", type: "helmet",
    rarity: "rare", value: 150, levelReq: 8,
    description: "A warm glow pulses from within.",
    stats: { maxHealth: 50, healthRegenPercent: 1 },
  },
  {
    id: "crown_of_embers", name: "Crown of Embers", type: "helmet",
    rarity: "legendary", value: 2500, levelReq: 20,
    description: "Forged in a fire that never went out.\nIt burns bright, and it burns the wearer.",
    stats: { damage: 25, critChance: 5, defence: -2 },
  },
  {
    id: "iron_chestplate", name: "Iron Chestplate", type: "chestplate",
    rarity: "uncommon", value: 60, levelReq: 3,
    stats: { defence: 5, maxHealth: 20 },
  },
  {
    id: "iron_leggings", name: "Iron Leggings", type: "leggings",
    rarity: "uncommon", value: 50, levelReq: 3,
    stats: { defence: 4, maxHealth: 15 },
  },
  {
    id: "leather_boots", name: "Leather Boots", type: "boots",
    rarity: "common", value: 8,
    stats: { defence: 1 },
  },

  // ----- Spells -----
  {
    id: "minor_heal", name: "Minor Heal", type: "healing_spell",
    rarity: "common", value: 20,
    description: "Restores a small amount of health.",
  },
  {
    id: "fireball", name: "Fireball", type: "damage_spell",
    rarity: "uncommon", value: 75, levelReq: 5,
    description: "Hurls a ball of fire at one target.",
    stats: { damage: 8 },
  },
  {
    id: "meteor_shower", name: "Meteor Shower", type: "aoe_spell",
    rarity: "epic", value: 600, levelReq: 15,
    description: "Rocks rain down on everyone in the room.",
  },
  {
    id: "ragnarok", name: "Ragnarok", type: "ultimate_spell",
    rarity: "mythic", value: 10000, levelReq: 30,
    description: "The end of everything. Use it wisely.",
  },

  // ----- Item bases (sold in the Item Bases shop) -----
  {
    id: "weapon_base", name: "Crude Weapon", type: "weapon",
    rarity: "common", value: 10,
    description: "Barely a weapon. It will need serious upgrading.",
    stats: { damage: 1 },
  },
  {
    id: "helmet_base", name: "Crude Helmet", type: "helmet",
    rarity: "common", value: 8,
    description: "Dented and thin, but better than nothing.",
    stats: { defence: 1 },
  },
  {
    id: "chestplate_base", name: "Crude Chestplate", type: "chestplate",
    rarity: "common", value: 12,
    description: "Patched together from scraps.",
    stats: { defence: 2, maxHealth: 5 },
  },
  {
    id: "leggings_base", name: "Crude Leggings", type: "leggings",
    rarity: "common", value: 10,
    description: "Stiff, scratchy, and worn at the knees.",
    stats: { defence: 1, maxHealth: 3 },
  },
  {
    id: "boots_base", name: "Crude Boots", type: "boots",
    rarity: "common", value: 8,
    description: "They fit. Mostly.",
    stats: { defence: 1 },
  },
  {
    id: "healing_spell_base", name: "Crude Healing Spell", type: "healing_spell",
    rarity: "common", value: 15,
    description: "A flicker of restorative magic. Barely a heal.",
  },
  {
    id: "damage_spell_base", name: "Crude Damage Spell", type: "damage_spell",
    rarity: "common", value: 20,
    description: "A weak spark aimed at a single target.",
    stats: { damage: 2 },
  },
  {
    id: "aoe_spell_base", name: "Crude AOE Spell", type: "aoe_spell",
    rarity: "common", value: 30,
    description: "A feeble burst that scatters in every direction.",
  },
  {
    id: "ultimate_spell_base", name: "Crude Ultimate Spell", type: "ultimate_spell",
    rarity: "common", value: 50,
    description: "An ultimate in name only.",
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
    description: "A steady, reliable mending.",
  },
  {
    id: "arc_bolt", name: "Arc Bolt", type: "damage_spell",
    rarity: "rare", value: 100, enhancementSlots: 4,
    description: "Lightning, aimed.",
    stats: { damage: 10 },
  },
]);