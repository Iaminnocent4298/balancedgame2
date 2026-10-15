import { ENHANCEMENTS } from "./enhancementCatalog";
import type { Enhancements, Equipment } from "./equipment";
import { ITEMS } from "./itemCatalog";
import { ARMOUR_SLOTS, type ItemTypeId } from "./items";

// The damage one equipped item brings: its own damage plus damage on its enhancements
function damageFromSlot(slot: ItemTypeId, equipment: Equipment, enhancements: Enhancements) {
  const item = ITEMS[equipment[slot] ?? ""];
  if (!item || item.type !== slot) return 0;
  let total = item.stats?.damage ?? 0;
  for (const id of enhancements[slot] ?? []) total += ENHANCEMENTS[id]?.stats?.damage ?? 0;
  return total;
}

// Damage of an attack made with the item in `selectedSlot` (a weapon or an attack spell).
// Only the SELECTED item's damage counts, so +100 on a spell never boosts a weapon hit.
export function getAttackDamage(
  selectedSlot: ItemTypeId,
  equipment: Equipment,
  enhancements: Enhancements
) {
  if (ARMOUR_SLOTS.includes(selectedSlot)) throw new Error("Armour can't be used to attack");

  const selected = damageFromSlot(selectedSlot, equipment, enhancements);
  const armour = ARMOUR_SLOTS.reduce(
    (sum, slot) => sum + damageFromSlot(slot, equipment, enhancements),
    0
  );
  return { selected, armour, total: selected + armour };
}

const round2 = (v: number) => Math.round(v * 100) / 100;

export type HitResult = { crit: boolean; damage: number };

export function resolveHit(input: {
  baseDamage: number; // step 1: from getAttackDamage(...).total
  strength: number; // the attacker's total strength
  critChance: number; // the attacker's total crit chance, in percent
  critDamage: number; // the attacker's total crit damage, in percent
  defence: number; // the TARGET's total defence
}): HitResult {
  // 2) Roll for a critical hit
  const crit = Math.random() * 100 < input.critChance;

  // 3a / 3b) Strength, plus crit damage if it crit
  let damage = input.baseDamage * Math.max(0, 1 + input.strength / 100);
  if (crit) damage *= Math.max(0, 1 + input.critDamage / 100);

  // 4 / 5) Defence removes def / (def + 100) of the damage
  const defence = Math.max(0, input.defence);
  damage *= 1 - defence / (defence + 100);

  return { crit, damage: round2(damage) };
}