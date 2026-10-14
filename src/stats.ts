// A player's stats are a flat map of numbers, e.g. { health: 100, maxHealth: 100, ... }
export type Stats = Record<string, number>;

export type StatDef = {
  id: string;
  icon: string;
  label: string;
  description?: string;
  fieldInfo?: Record<string, { label?: string; suffix?: string }>; // per-field name/unit overrides
  fields: Stats;
  display: (s: Stats) => string;
};

// Rounds to at most 2 decimals
const n = (v: number) => String(Math.round(v * 100) / 100);

export const STATS: StatDef[] = [
  {
    id: "level", icon: "✷", label: "Level",
    description: "test",
    fields: { level: 1, levelXp: 0, nextLevelXp: 100 },
    display: (s) => `${n(s.level)} [${n(s.levelXp)}/${n(s.nextLevelXp)}]`,
  },
  {
    id: "abilityPoints", icon: "✹", label: "Ability Points",
    fields: { abilityPoints: 0 },
    display: (s) => n(s.abilityPoints),
  },
  {
    id: "health", icon: "❤", label: "Health",
    fields: { health: 1000, maxHealth: 1000 },
    fieldInfo: { maxHealth: { label: "Max Health" } },
    display: (s) => `${n(s.health)}/${n(s.maxHealth)}`,
  },
  {
    id: "healthRegen", icon: "❣", label: "Health Regen",
    fields: { healthRegenRaw: 0, healthRegenPercent: 1 },
    fieldInfo: {
        healthRegenRaw: { label: "Health Regen" },
        healthRegenPercent: { label: "Health Regen", suffix: "%" },
    },
    display: (s) => `${n(s.healthRegenRaw)} + ${n(s.healthRegenPercent)}%`,
  },
  {
    id: "mana", icon: "✸", label: "Mana",
    fields: { mana: 100, maxMana: 100 },
    fieldInfo: { maxMana: { label: "Max Mana" } },
    display: (s) => `${n(s.mana)}/${n(s.maxMana)}`,
  },
  {
    id: "manaRegen", icon: "⸎", label: "Mana Regen",
    fields: { manaRegenRaw: 0, manaRegenPercent: 1 },
    fieldInfo: {
        manaRegenRaw: { label: "Mana Regen" },
        manaRegenPercent: { label: "Mana Regen", suffix: "%" },
    },
    display: (s) => `${n(s.manaRegenRaw)} + ${n(s.manaRegenPercent)}%`,
  },
  {
    id: "damage", icon: "🗡", label: "Damage",
    fields: { damage: 1 },
    display: (s) => n(s.damage),
  },
  {
    id: "strength", icon: "✤", label: "Strength",
    fields: { strength: 0 },
    display: (s) => n(s.strength),
  },
  {
    id: "critChance", icon: "✦", label: "Crit Chance",
    fields: { critChance: 0 },
    fieldInfo: { critChance: { suffix: "%" } },
    display: (s) => `${n(s.critChance)}%`,
  },
  {
    id: "critDamage", icon: "☠", label: "Crit Damage",
    fields: { critDamage: 0 },
    display: (s) => n(s.critDamage),
  },
  {
    id: "defence", icon: "❈", label: "Defence",
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

// Fills in defaults for any field a player doesn't have yet, so adding
// a new stat later never breaks players who are already in a room.
export function withDefaults(stats: Stats | null | undefined): Stats {
  return { ...DEFAULT_STATS, ...(stats ?? {}) };
}

function prettify(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

// Icon, name, and unit for ONE stored field (used by item tooltips)
export function describeField(key: string): { icon: string; label: string; suffix: string } {
  for (const def of STATS) {
    if (!(key in def.fields)) continue;
    const info = def.fieldInfo?.[key];
    return {
      icon: def.icon,
      label: info?.label ?? (Object.keys(def.fields).length === 1 ? def.label : prettify(key)),
      suffix: info?.suffix ?? "",
    };
  }
  return { icon: "", label: prettify(key), suffix: "" };
}