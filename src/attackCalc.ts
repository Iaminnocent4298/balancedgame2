import type { Enhancements, Equipment } from "./equipment";
import { ENHANCEMENTS, getEquippedItem } from "./catalog";
import { ARMOUR_SLOTS, type SlotId } from "./items";
import { round2 } from "./format";

// One item-only stat (damage, healRaw, healPercent) from the item in a slot,
// plus the same stat on that item's enhancements
function statFromSlot(
  slot: SlotId,
  field: string,
  equipment: Equipment,
  enhancements: Enhancements
): number {
  const item = getEquippedItem(equipment, slot);
  if (!item) return 0;
  let total = item.stats?.[field] ?? 0;
  for (const id of enhancements[slot] ?? []) total += ENHANCEMENTS[id]?.stats?.[field] ?? 0;
  return total;
}

// Damage of an attack made with the item in `selectedSlot` (a weapon or an attack spell).
// Only the SELECTED item's damage counts, so +100 on a spell never boosts a weapon hit.
export function getAttackDamage(
  selectedSlot: SlotId,
  equipment: Equipment,
  enhancements: Enhancements
) {
  if (ARMOUR_SLOTS.includes(selectedSlot)) throw new Error("Armour can't be used to attack");

  const selected = statFromSlot(selectedSlot, "damage", equipment, enhancements);
  const armour = ARMOUR_SLOTS.reduce(
    (sum, slot) => sum + statFromSlot(slot, "damage", equipment, enhancements),
    0
  );
  return { selected, armour, total: selected + armour };
}

// What a healing spell heals: a flat amount and/or a percentage of the target's max health
export function getHealing(slot: SlotId, equipment: Equipment, enhancements: Enhancements) {
  return {
    raw: statFromSlot(slot, "healRaw", equipment, enhancements),
    percent: statFromSlot(slot, "healPercent", equipment, enhancements),
  };
}

export type HitResult = { crit: boolean; damage: number };

export function resolveHit(input: {
  baseDamage: number; // from getAttackDamage(...).total
  strength: number; // the attacker's total strength
  critChance: number; // the attacker's total crit chance, in percent
  critDamage: number; // the attacker's total crit damage, in percent
  defence: number; // the TARGET's total defence
}): HitResult {
  // Roll for a critical hit
  const crit = Math.random() * 100 < input.critChance;

  // Strength, plus crit damage if it crit
  let damage = input.baseDamage * Math.max(0, 1 + input.strength / 100);
  if (crit) damage *= Math.max(0, 1 + input.critDamage / 100);

  // Defence removes def / (def + 100) of the damage
  const defence = Math.max(0, input.defence);
  damage *= 1 - defence / (defence + 100);

  return { crit, damage: round2(damage) };
}