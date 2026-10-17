import { ENHANCEMENT_ONLY_FIELDS, ITEM_MODIFIABLE_FIELDS } from "./stats";
import { SHOPS, type ShopId } from "./shops";

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

// ===== The catalog: everything with a price and a rarity =====
// Items (gear and spells), enhancements, and expanders all live in catalog.ts.
export type ItemStats = Record<string, number>;

type Common = {
  id: string; // unique across the WHOLE catalog, and permanent
  name: string;
  rarity: RarityId;
  value: number; // in coins. Also the shop price unless `price` is set
  description?: string; // lore
  levelReq?: number; // minimum level to buy it. Omit if none
  shop?: ShopId | ShopId[]; // which shop(s) sell it. Omit if it isn't sold anywhere
  price?: number; // shop price, if it should differ from `value`
};

// What you write in catalog.ts (no `kind`: the section you put it in sets it)
export type ItemDef = Common & {
  type: ItemTypeId; // decides which slots it fits in
  enhancementSlots: number; // base enhancement slots (0 = none). Required on every item
  manaCost?: number; // SPELLS ONLY: whole-number mana per cast. Required for spells
  stats?: ItemStats; // keys are stat field names, e.g. { damage: 5, maxHealth: 50 }
};
export type EnhancementDef = Common & { stats?: ItemStats };
export type ExpanderDef = Common & { slots: number }; // enhancement slots it adds

export type Item = ItemDef & { kind: "item" };
export type Enhancement = EnhancementDef & { kind: "enhancement" };
export type Expander = ExpanderDef & { kind: "expander" };
export type CatalogEntry = Item | Enhancement | Expander;

export const shopsOf = (e: CatalogEntry): ShopId[] =>
  e.shop === undefined ? [] : Array.isArray(e.shop) ? e.shop : [e.shop];

export const getPrice = (e: CatalogEntry) => e.price ?? e.value;

// The small label under a name in shops, and in tooltips
export const kindLabel = (e: CatalogEntry) =>
  e.kind === "item"
    ? getItemType(e.type).label
    : e.kind === "enhancement"
      ? "Enhancement"
      : "Expander";

// Builds the catalog and catches mistakes as soon as the app loads
export function defineCatalog(input: {
  items: ItemDef[];
  enhancements: EnhancementDef[];
  expanders: ExpanderDef[];
}): CatalogEntry[] {
  const all: CatalogEntry[] = [];
  const ids = new Set<string>();

  function common(e: Common, label: string) {
    if (ids.has(e.id)) throw new Error(`Duplicate catalog id: ${e.id}`);
    ids.add(e.id);
    if (!(e.value >= 0)) throw new Error(`${label} "${e.id}" needs a value of 0 or more`);
    if (e.price !== undefined && !(e.price >= 0)) {
      throw new Error(`${label} "${e.id}" has an invalid price`);
    }
    if (e.levelReq !== undefined && !(e.levelReq >= 1)) {
      throw new Error(`${label} "${e.id}" has an invalid levelReq`);
    }
    const shops = e.shop === undefined ? [] : Array.isArray(e.shop) ? e.shop : [e.shop];
    for (const shop of shops) {
      if (!(shop in SHOPS)) throw new Error(`${label} "${e.id}" is in unknown shop "${shop}"`);
    }
  }

  for (const e of input.items) {
    common(e, "Item");
    if (!ITEM_TYPES.some((t) => t.id === e.type)) {
      throw new Error(`Item "${e.id}" has an unknown type "${e.type}"`);
    }
    if (!(Number.isInteger(e.enhancementSlots) && e.enhancementSlots >= 0)) {
      throw new Error(`Item "${e.id}" needs a whole-number enhancementSlots of 0 or more`);
    }
    const isSpell = SPELL_TYPES.includes(e.type);
    if (isSpell && e.manaCost === undefined) throw new Error(`Spell "${e.id}" needs a manaCost`);
    if (!isSpell && e.manaCost !== undefined) {
      throw new Error(`Item "${e.id}" has a manaCost but isn't a spell`);
    }
    if (e.manaCost !== undefined && !(Number.isInteger(e.manaCost) && e.manaCost >= 0)) {
      throw new Error(`Item "${e.id}" needs a whole-number manaCost of 0 or more`);
    }
    for (const key of Object.keys(e.stats ?? {})) {
      if (ENHANCEMENT_ONLY_FIELDS.includes(key)) {
        throw new Error(`Item "${e.id}" can't modify "${key}": only enhancements can`);
      }
      if (!ITEM_MODIFIABLE_FIELDS.includes(key)) {
        throw new Error(`Item "${e.id}" can't modify "${key}" (unknown or not modifiable)`);
      }
    }
    all.push({ ...e, kind: "item" });
  }

  for (const e of input.enhancements) {
    common(e, "Enhancement");
    for (const key of Object.keys(e.stats ?? {})) {
      if (!ITEM_MODIFIABLE_FIELDS.includes(key)) {
        throw new Error(`Enhancement "${e.id}" can't modify "${key}"`);
      }
    }
    all.push({ ...e, kind: "enhancement" });
  }

  for (const e of input.expanders) {
    common(e, "Expander");
    if (!(Number.isInteger(e.slots) && e.slots >= 1)) {
      throw new Error(`Expander "${e.id}" needs a whole number of slots (1 or more)`);
    }
    all.push({ ...e, kind: "expander" });
  }

  return all;
}

// ===== Salvaging =====
export const SALVAGE_RATE = 0.5; // 50% of an item's and its enhancements' value
export const getSalvageValue = (
  item: Item,
  enhancements: readonly Pick<Enhancement, "value">[] = []
) => Math.floor((item.value + enhancements.reduce((sum, enhancement) => sum + enhancement.value, 0)) * SALVAGE_RATE);

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
  ultimate_spell: "attack",
  healing_spell: "heal",
};

// The word used in the log: "<attacker> bonked <victim> for ... damage"
export const ATTACK_VERBS: Partial<Record<ItemTypeId, string>> = {
  weapon: "bonked",
  damage_spell: "spelled",
  ultimate_spell: "exploded",
};

for (const [type, kind] of Object.entries(ACTION_KINDS)) {
  if (kind === "attack" && !ATTACK_VERBS[type as ItemTypeId]) {
    throw new Error(`Attack type "${type}" needs a verb in ATTACK_VERBS`);
  }
}