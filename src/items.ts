import { ITEM_MODIFIABLE_FIELDS } from "./stats";

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

// ===== Item types: what kind of thing an item is =====
export const ITEM_TYPES = [
  { id: "weapon", label: "Weapon" },
  { id: "helmet", label: "Helmet" },
  { id: "chestplate", label: "Chestplate" },
  { id: "leggings", label: "Leggings" },
  { id: "boots", label: "Boots" },
  { id: "healing_spell", label: "Healing Spell" },
  { id: "damage_spell", label: "Damage Spell" },
  { id: "aoe_spell", label: "AOE Spell" },
  { id: "ultimate_spell", label: "Ultimate Spell" },
] as const;
export type ItemTypeId = (typeof ITEM_TYPES)[number]["id"];

export const getItemType = (id: ItemTypeId) => ITEM_TYPES.find((t) => t.id === id)!;

export const SPELL_TYPES: ItemTypeId[] = [
  "healing_spell", "damage_spell", "aoe_spell", "ultimate_spell",
];

// ===== The item type. New attributes go here (make them optional). =====
// Keys are stat field names, e.g. { damage: 5, maxHealth: 50, healRaw: 20 }.
// Values can be negative. Stats not listed are unaffected.
export type ItemStats = Record<string, number>;

export type Item = {
  id: string; // unique and permanent, e.g. "iron_sword"
  name: string;
  type: ItemTypeId; // decides which slots it fits in
  rarity: RarityId;
  value: number; // in coins
  levelReq?: number; // omit if the item has no level requirement
  description?: string; // lore. Omit if none
  stats?: ItemStats; // omit if the item doesn't change any stats
  enhancementSlots: number; // how many enhancements it can hold (0 = none). Required on every item
  manaCost?: number; // SPELLS ONLY: mana spent per cast (a whole number). Required for spells
};

// Builds a lookup by id and catches mistakes as soon as the app loads
export function defineItems(list: Item[]): Record<string, Item> {
  const out: Record<string, Item> = {};
  for (const item of list) {
    if (item.id in out) throw new Error(`Duplicate item id: ${item.id}`);
    if (!ITEM_TYPES.some((t) => t.id === item.type)) {
      throw new Error(`Item "${item.id}" has an unknown type "${item.type}"`);
    }
    if (!(item.value >= 0)) throw new Error(`Item "${item.id}" needs a value of 0 or more`);
    if (item.levelReq !== undefined && !(item.levelReq >= 1)) {
      throw new Error(`Item "${item.id}" has an invalid levelReq`);
    }
    if (!(Number.isInteger(item.enhancementSlots) && item.enhancementSlots >= 0)) {
      throw new Error(`Item "${item.id}" needs a whole-number enhancementSlots of 0 or more`);
    }

    const isSpell = SPELL_TYPES.includes(item.type);
    if (isSpell && item.manaCost === undefined) {
      throw new Error(`Spell "${item.id}" needs a manaCost`);
    }
    if (!isSpell && item.manaCost !== undefined) {
      throw new Error(`Item "${item.id}" has a manaCost but isn't a spell`);
    }
    if (
      item.manaCost !== undefined &&
      !(Number.isInteger(item.manaCost) && item.manaCost >= 0)
    ) {
      throw new Error(`Item "${item.id}" needs a whole-number manaCost of 0 or more`);
    }

    for (const key of Object.keys(item.stats ?? {})) {
      if (!ITEM_MODIFIABLE_FIELDS.includes(key)) {
        throw new Error(`Item "${item.id}" can't modify "${key}" (unknown or not modifiable)`);
      }
    }
    out[item.id] = item;
  }
  return out;
}

// ===== Salvaging =====
export const SALVAGE_RATE = 0.5; // 50% of an item's value
export const getSalvageValue = (item: Item) => Math.floor(item.value * SALVAGE_RATE);

// ===== Enhancement slots =====
// Each item sets its own base count in the catalog. Slots bought with expanders are added on top.
export const getMaxEnhancements = (item: Item, extraSlots = 0) =>
  item.enhancementSlots + extraSlots;

// Only items that START with at least one slot can be expanded.
// enhancementSlots: 0 makes an item permanently unenhanceable.
export const canExpandSlots = (item: Item) => item.enhancementSlots > 0;

// ===== Equipment slots: where a player's items live =====
// Each slot says which item types it accepts. The four spell slots take ANY spell.
export type SlotId =
  | "weapon" | "helmet" | "chestplate" | "leggings" | "boots"
  | "spell1" | "spell2" | "spell3" | "spell4";

export type SlotDef = { id: SlotId; label: string; accepts: ItemTypeId[] };

export const SLOTS: SlotDef[] = [
  { id: "weapon", label: "Weapon", accepts: ["weapon"] },
  { id: "helmet", label: "Helmet", accepts: ["helmet"] },
  { id: "chestplate", label: "Chestplate", accepts: ["chestplate"] },
  { id: "leggings", label: "Leggings", accepts: ["leggings"] },
  { id: "boots", label: "Boots", accepts: ["boots"] },
  { id: "spell1", label: "Spell 1", accepts: SPELL_TYPES },
  { id: "spell2", label: "Spell 2", accepts: SPELL_TYPES },
  { id: "spell3", label: "Spell 3", accepts: SPELL_TYPES },
  { id: "spell4", label: "Spell 4", accepts: SPELL_TYPES },
];

export const GEAR_SLOTS: SlotId[] = ["weapon", "helmet", "chestplate", "leggings", "boots"];
export const ARMOUR_SLOTS: SlotId[] = ["helmet", "chestplate", "leggings", "boots"];
export const SPELL_SLOTS: SlotId[] = ["spell1", "spell2", "spell3", "spell4"];

export const getSlot = (id: SlotId): SlotDef => SLOTS.find((s) => s.id === id)!;

// Safe for unknown slot names (old saved data), which simply don't match anything
export const slotAccepts = (slot: SlotId, type: ItemTypeId) =>
  SLOTS.find((s) => s.id === slot)?.accepts.includes(type) ?? false;

// Every slot an item of this type could go in, in order
export const slotsFor = (type: ItemTypeId): SlotId[] =>
  SLOTS.filter((s) => s.accepts.includes(type)).map((s) => s.id);

// ===== What can be used from the Action menu =====
export type ActionKind = "attack" | "heal";

// Item types that can be used on a player, and what they do.
// AOE and ultimate spells aren't usable until their rules are designed.
export const ACTION_KINDS: Partial<Record<ItemTypeId, ActionKind>> = {
  weapon: "attack",
  damage_spell: "attack",
  healing_spell: "heal",
};

// The word used in the log: "<attacker> bonked <victim> for ... damage"
export const ATTACK_VERBS: Partial<Record<ItemTypeId, string>> = {
  weapon: "bonked",
  damage_spell: "spelled",
};
for (const [type, kind] of Object.entries(ACTION_KINDS)) {
  if (kind === "attack" && !ATTACK_VERBS[type as ItemTypeId]) {
    throw new Error(`Attack type "${type}" needs a verb in ATTACK_VERBS`);
  }
}