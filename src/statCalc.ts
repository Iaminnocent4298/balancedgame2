import { COMPOSITE_FIELDS, POINT_RATES, USE_BOUND_FIELDS, withDefaults, type Stats } from "./stats";
import { USED_SLOTS, type SlotId } from "./items";
import { getEquippedItem, resolveEnhancements } from "./catalog";
import type { Enhancements, Equipment } from "./equipment";

export type StatBreakdown = {
  base: number;
  points: number;
  equipment: number; // items + their enhancements
  total: number; // base + points + equipment
};

// Sum of the stat modifiers of everything equipped, plus the enhancements on it.
// Items in the wrong slot or missing from the catalog are ignored.
// Use-bound stats (Attack Speed) on a weapon or spell, or on its enhancements, are left out: they
// only speed up that item's own use (see getItemAttackSpeed). Armour's still count.
export function getEquipmentBonuses(
  equipment: Equipment | null | undefined,
  enhancements?: Enhancements | null
): Stats {
  const sum: Stats = {};

  for (const slot of Object.keys(equipment ?? {}) as SlotId[]) {
    const item = getEquippedItem(equipment, slot);
    if (!item) continue;

    const leftOut = USED_SLOTS.includes(slot) ? USE_BOUND_FIELDS : [];
    const add = (stats?: Record<string, number>) => {
      for (const [key, amount] of Object.entries(stats ?? {})) {
        if (!leftOut.includes(key)) sum[key] = (sum[key] ?? 0) + amount;
      }
    };

    add(item.stats);
    for (const enhancement of resolveEnhancements(enhancements?.[slot])) add(enhancement.stats);
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