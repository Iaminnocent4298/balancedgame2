import { scaleToMode } from "./gameClock";
import type { SlotId } from "./items";
import type { RoomMode } from "./rooms";

// Only the weapon has a cooldown. Spells cost mana instead (manaCost in items.ts).
// Written for SPEED mode, then scaled by the room's mode like every timed event.
export const ATTACK_COOLDOWN_SPEED_MS: Partial<Record<SlotId, number>> = {
  weapon: 60_000,
};

export const getAttackCooldownMs = (slot: SlotId, mode: RoomMode) =>
  scaleToMode(ATTACK_COOLDOWN_SPEED_MS[slot] ?? 0, mode);