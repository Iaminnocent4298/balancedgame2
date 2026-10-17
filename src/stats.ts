// A player's stats are a flat map of numbers, e.g. { health: 100, maxHealth: 100, ... }
export type Stats = Record<string, number>;

export type StatDef = {
  id: string;
  icon: string;
  label: string;
  description?: string;
  fieldInfo?: Record<string, { label?: string; suffix?: string }>;
  plain?: string[];
  perPoint?: Record<string, number>; // fields that can take ability points: stat gained per 1 AP
  fields: Stats;
  display: (s: Stats) => string;
};

// Rounds to at most 2 decimals
const n = (v: number) => String(Math.round(v * 100) / 100);

export const STATS: StatDef[] = [
  {
    id: "level", icon: "✷", label: "Level",
    description: "Gain xp by dealing damage! When levelling up, you gain ability points",
    plain: ["level", "levelXp", "nextLevelXp"],
    fields: { level: 0, levelXp: 0, nextLevelXp: 50 },
    display: (s) => `${n(s.level)} ➩ ${n(s.level+1)} [${n(s.levelXp)}/${n(s.nextLevelXp)}]`,
  },
  {
    id: "abilityPoints", icon: "✹", label: "Ability Points",
    description: "Gain AP when levelling up! Use them on speccing into your stats",
    plain: ["abilityPoints"],
    fields: { abilityPoints: 0 },
    display: (s) => n(s.abilityPoints),
  },
  {
    id: "coins", icon: "$", label: "Coins",
    description: "Use coins to purchase literally anything in the shop. Gain coins by dealing damage!",
    plain: ["coins"],   // a plain value: not split into base/points/equipment
    fields: { coins: 100 },
    display: (s) => n(s.coins),
  },
  {
    id: "health", icon: "❤", label: "Health",
    description: "If this stat is 0 then you're dead",
    plain: ["health"],
    perPoint: { maxHealth: 25 },
    fields: { health: 1000, maxHealth: 1000 },
    fieldInfo: { maxHealth: { label: "Max Health" } },
    display: (s) => `${n(s.health)}/${n(s.maxHealth)}`,
  },
  {
    id: "healthRegen", icon: "❣", label: "Health Regen",
    description: "Health regen tick occurs at noon and midnight of each in-game day",
    perPoint: { healthRegenRaw: 5 },
    fields: { healthRegenRaw: 0, healthRegenPercent: 1 },
    fieldInfo: {
        healthRegenRaw: { label: "Health Regen" },
        healthRegenPercent: { label: "Health Regen", suffix: "%" },
    },
    display: (s) => `${n(s.healthRegenRaw)} + ${n(s.healthRegenPercent)}%`,
  },
  {
    id: "mana", icon: "✸", label: "Mana",
    description: "Casting spells costs mana to use them",
    plain: ["mana"],
    perPoint: { maxMana: 5 },
    fields: { mana: 100, maxMana: 100 },
    fieldInfo: { maxMana: { label: "Max Mana" } },
    display: (s) => `${n(s.mana)}/${n(s.maxMana)}`,
  },
  {
    id: "manaRegen", icon: "⸎", label: "Mana Regen",
    description: "Mana regen tick occurs at noon and midnight of each in-game day",
    perPoint: { manaRegenRaw: 0.5 },
    fields: { manaRegenRaw: 5, manaRegenPercent: 1 },
    fieldInfo: {
        manaRegenRaw: { label: "Mana Regen" },
        manaRegenPercent: { label: "Mana Regen", suffix: "%" },
    },
    display: (s) => `${n(s.manaRegenRaw)} + ${n(s.manaRegenPercent)}%`,
  },
  {
    id: "strength", icon: "✤", label: "Strength",
    description: "Strength increases the amount of damage you deal on any attack",
    perPoint: { strength: 1 },
    fields: { strength: 0 },
    display: (s) => n(s.strength),
  },
  {
    id: "critChance", icon: "✦", label: "Crit Chance",
    description: "Crit Chance is the percentage chance you deal a critical hit",
    perPoint: { critChance: 0.25 },
    fields: { critChance: 0 },
    fieldInfo: { critChance: { suffix: "%" } },
    display: (s) => `${n(s.critChance)}%`,
  },
  {
    id: "critDamage", icon: "☠", label: "Crit Damage",
    description: "Crit Damage increases the amount of damage dealt during a critical hit",
    perPoint: { critDamage: 1 },
    fields: { critDamage: 0 },
    display: (s) => n(s.critDamage),
  },
  {
    id: "defence", icon: "❈", label: "Defence",
    description: "Defence decreases the amount of damage you would have taken",
    perPoint: { defence: 1 },
    fields: { defence: 0 },
    display: (s) => n(s.defence),
  },
];

// Every stored field's default, built automatically from the list above
export const DEFAULT_STATS: Stats = {};
for (const def of STATS) {
  for (const [key, value] of Object.entries(def.fields)) {
    if (key in DEFAULT_STATS) throw new Error(`Duplicate stat field: ${key}`);
    DEFAULT_STATS[key] = value;
  }
}

// Fields that get the base/points/equipment split: everything not marked plain
const PLAIN = new Set(STATS.flatMap((def) => def.plain ?? []));
for (const key of PLAIN) {
  if (!(key in DEFAULT_STATS)) throw new Error(`"plain" lists unknown stat field: ${key}`);
}
export const COMPOSITE_FIELDS = Object.keys(DEFAULT_STATS).filter((k) => !PLAIN.has(k));

// Fields players can spend ability points on: field -> stat gained per point
export const POINT_RATES: Record<string, number> = {};
for (const def of STATS) {
  for (const [key, rate] of Object.entries(def.perPoint ?? {})) {
    if (!COMPOSITE_FIELDS.includes(key)) {
      throw new Error(`"perPoint" lists a field that can't take points: ${key}`);
    }
    if (!(rate > 0)) throw new Error(`"perPoint" rate for ${key} must be above 0`);
    POINT_RATES[key] = rate;
  }
}

// ===== Item-only stats =====
// These exist ONLY on items and enhancements, not on players. They apply when that
// item is used: a weapon's damage applies to attacks made with that weapon.
export type ItemStatDef = { id: string; icon: string; label: string; suffix?: string };

export const ITEM_STATS: ItemStatDef[] = [
  { id: "damage", icon: "🗡", label: "Damage" },
  { id: "healRaw", icon: "❣", label: "Heal" },
  { id: "healPercent", icon: "❣", label: "Heal", suffix: "% max health" },
];

for (const s of ITEM_STATS) {
  if (s.id in DEFAULT_STATS) throw new Error(`Item stat "${s.id}" clashes with a player stat`);
}

// Everything an item or enhancement is allowed to modify
export const ITEM_MODIFIABLE_FIELDS = [...COMPOSITE_FIELDS, ...ITEM_STATS.map((s) => s.id)];

// Fills in defaults for any field a player doesn't have yet, so adding
// a new stat later never breaks players who are already in a room.
export function withDefaults(stats: Stats | null | undefined): Stats {
  return { ...DEFAULT_STATS, ...(stats ?? {}) };
}

// A player at 0 health or below is dead and can only spectate
export const isDead = (stats: Stats | null | undefined) => withDefaults(stats).health <= 0;

function prettify(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

// Icon, name, and unit for ONE stored field (used by item tooltips)
export function describeField(key: string): {
  icon: string; label: string; suffix: string; statId: string;
} {
  for (const def of STATS) {
    if (!(key in def.fields)) continue;
    const info = def.fieldInfo?.[key];
    return {
      icon: def.icon,
      label: info?.label ?? (Object.keys(def.fields).length === 1 ? def.label : prettify(key)),
      suffix: info?.suffix ?? "",
      statId: def.id,
    };
  }
  const itemStat = ITEM_STATS.find((s) => s.id === key);
  if (itemStat) {
    return { icon: itemStat.icon, label: itemStat.label, suffix: itemStat.suffix ?? "", statId: "" };
  }
  return { icon: "", label: prettify(key), suffix: "", statId: "" };
}