import { defineEnhancements } from "./enhancements";

export const ENHANCEMENTS = defineEnhancements([
  {
    id: "strength", name: "Strength", 
    rarity: "common", value: 15,
    stats: { strength: 10 },
  },
  {
    id: "defence", name: "Defence", 
    rarity: "common", value: 15,
    stats: { defence: 10 },
  },
  {
    id: "critical", name: "Critical", 
    rarity: "common", value: 15,
    stats: { critChance: 1, critDamage: 5 },
  },
  {
    id: "medic", name: "Medic", 
    rarity: "common", value: 15,
    stats: { maxHealth: 50, healthRegenRaw: 5 },
  },
  {
    id: "mana", name: "Wizard", 
    rarity: "common", value: 15,
    stats: { maxMana: 5, manaRegenRaw: 1 },
  },
  {
    id: "berserker", name: "Berserker", 
    rarity: "uncommon", value: 35,
    stats: { strength: 25, critChance: 2.5, critDamage: 15 },
  },
  {
    id: "tank", name: "Tank", 
    rarity: "uncommon", value: 35,
    stats: { defence: 25, maxHealth: 100, healthRegenRaw: 15, healthRegenPercent: 0.5 },
  },
  {
    id: "healer", name: "Healer", 
    rarity: "uncommon", value: 35,
    stats: { maxHealth: 250, healthRegenRaw: 25, healthRegenPercent: 1 },
  },
  {
    id: "mage", name: "Mage", 
    rarity: "uncommon", value: 35,
    stats: { maxMana: 15, manaRegenRaw: 3, manaRegenPercent: 1 },
  },
  {
    id: "balanced", name: "Balanced", 
    rarity: "uncommon", value: 35,
    stats: { strength: 10, critDamage: 10, defence: 10 },
  },

  // ----- Limited enhancements (sold in the Limited! shop) -----
  {
    id: "glass_cannon", name: "Glass Cannon", 
    rarity: "rare", value: 75,
    stats: { strength: 60, critChance: 5, critDamage: 35, defence: -50 },
  },
  {
    id: "shielded", name: "Shielded", 
    rarity: "rare", value: 75,
    stats: { strength: -20, critDamage: -20, defence: 100, maxHealth: 500 },
  },
  {
    id: "stubborn", name: "Stubbornness", 
    rarity: "rare", value: 75,
    stats: { maxHealth: 1000, healthRegenRaw: 100, healthRegenPercent: 2.5, manaRegenRaw: -50, strength: -50, critDamage: -50 },
  },
  {
    id: "ning", name: "Ninja", 
    rarity: "rare", value: 75,
    stats: { maxMana: 50, manaRegenRaw: 10, manaRegenPercent: 2.5, strength: -50, critDamage: -50 },
  },
  {
    id: "brittle", name: "Glass Cannon++", 
    rarity: "epic", value: 150,
    stats: { strength: 100, critChance: 15, critDamage: 75, defence: -100, maxHealth: -250, healthRegenRaw: -25, healthRegenPercent: -1 },
  },
  {
    id: "academic_weapon", name: "Academic Weapon", 
    rarity: "epic", value: 150,
    stats: { maxMana: 100, manaRegenRaw: 15, manaRegenPercent: 5 },
  },
  {
    id: "academic_victim", name: "Academic Victim", 
    rarity: "epic", value: 150,
    stats: { maxMana: -100, manaRegenRaw: -15, manaRegenPercent: -5 },
  },
]);