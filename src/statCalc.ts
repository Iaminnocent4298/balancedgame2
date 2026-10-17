import { COMPOSITE_FIELDS, POINT_RATES, withDefaults, type Stats } from "./stats";
import { ENHANCEMENTS, getEquippedItem } from "./catalog";
import type { SlotId } from "./items";
import type { Enhancements, Equipment } from "./equipment";

export type StatBreakdown = {
  base: number;
  points: number;
  equipment: number; // items + their enhancements
  total: number; // base + points + equipment
};

// Sum of the stat modifiers of everything equipped, plus the enhancements on it.
// Items in the wrong slot or missing from the catalog are ignored.
export function getEquipmentBonuses(
  equipment: Equipment | null | undefined,
  enhancements?: Enhancements | null
): Stats {
  const sum: Stats = {};
  const add = (stats?: Record<string, number>) => {
    for (const [key, amount] of Object.entries(stats ?? {})) {
      sum[key] = (sum[key] ?? 0) + amount;
    }
  };

  for (const slot of Object.keys(equipment ?? {}) as SlotId[]) {
    const item = getEquippedItem(equipment, slot);
    if (!item) continue;
    add(item.stats);
    for (const id of enhancements?.[slot] ?? []) add(ENHANCEMENTS[id]?.stats);
  }
  return sum;
}

// All three parts plus the total, for every split field.
// USE THIS for damage calculations: getBreakdowns(...).damage.total
export function getBreakdowns(
  stats: Stats | null | undefined,
  points: Stats | null | undefined,
  equipment: Equipment | null | undefined,
  enhancements?: Enhancements | null
): Record<string, StatBreakdown> {
  const base = withDefaults(stats);
  const bonuses = getEquipmentBonuses(equipment, enhancements);
  const out: Record<string, StatBreakdown> = {};
  for (const key of COMPOSITE_FIELDS) {
    const b = base[key];
    const p = (points?.[key] ?? 0) * (POINT_RATES[key] ?? 0); // AP spent x stat per AP
    const e = bonuses[key] ?? 0;
    out[key] = { base: b, points: p, equipment: e, total: b + p + e };
  }
  return out;
}

// What the stats table shows: totals for split fields, stored values for the rest
export function getDisplayStats(
  stats: Stats | null | undefined,
  points: Stats | null | undefined,
  equipment: Equipment | null | undefined,
  enhancements?: Enhancements | null
): Stats {
  const out = withDefaults(stats);
  for (const [key, b] of Object.entries(getBreakdowns(stats, points, equipment, enhancements))) {
    out[key] = b.total;
  }
  return out;
}