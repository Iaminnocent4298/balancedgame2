import type { Enhancements, Equipment } from "./equipment";
import { scaleToMode } from "./gameClock";
import type { RoomMode } from "./rooms";
import { getBreakdowns } from "./statCalc";
import { withDefaults, type Stats } from "./stats";

// Regen happens twice per in-game day. A Speed-mode day is 2 minutes, so one tick is 1 minute.
export const REGEN_INTERVAL_SPEED_MS = 60_000;

export const getRegenInterval = (mode: RoomMode) => scaleToMode(REGEN_INTERVAL_SPEED_MS, mode);

// How many regen ticks have happened since the game started (0, 1, 2...).
// Ticks are tied to the game's start, not to when a player happens to be online.
export function getRegenTick(mode: RoomMode, startMs: number, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - startMs) / getRegenInterval(mode)));
}

const round2 = (v: number) => Math.round(v * 100) / 100;

// The player fields regen needs
export type RegenSubject = {
  stats?: Stats | null;
  points?: Stats | null;
  equipment?: Equipment | null;
  enhancements?: Enhancements | null;
  regenTick?: number | null; // the last tick this player has been paid up to
};

export type RegenResult = { health: number; mana: number; coins: number; tick: number };

// Applies every tick that has happened since the player's last one.
// Returns null if none are due. Dead players don't regen or earn coins,
// but their tick still advances.
export function computeRegen(player: RegenSubject, currentTick: number): RegenResult | null {
  const missed = currentTick - (player.regenTick ?? 0);
  if (missed <= 0) return null;

  const stats = withDefaults(player.stats);
  if (stats.health <= 0) {
    return { health: stats.health, mana: stats.mana, coins: stats.coins, tick: currentTick };
  }

  const t = getBreakdowns(player.stats, player.points, player.equipment, player.enhancements);

  // Regen is the flat amount plus a percentage of the MAXIMUM
  const maxHealth = Math.max(1, t.maxHealth.total);
  const healthPerTick = Math.max(
    0,
    t.healthRegenRaw.total + (maxHealth * t.healthRegenPercent.total) / 100
  );

  // Mana is always a whole number: the amount per tick rounds to the nearest whole,
  // and the cap rounds down
  const maxManaExact = Math.max(0, t.maxMana.total);
  const maxMana = Math.floor(maxManaExact);
  const manaPerTick = Math.max(
    0,
    Math.round(t.manaRegenRaw.total + (maxManaExact * t.manaRegenPercent.total) / 100)
  );

  // Coins are whole numbers too: coin gain rounds to the nearest whole coin per tick
  const coinsPerTick = Math.max(0, Math.round(t.coinGain.total));

  // Math.min is the overflow guard. It also trims a value that was already over the max
  return {
    health: round2(Math.min(maxHealth, stats.health + missed * healthPerTick)),
    mana: Math.floor(Math.min(maxMana, stats.mana + missed * manaPerTick)),
    coins: stats.coins + missed * coinsPerTick,
    tick: currentTick,
  };
}

// Health and mana can never exceed their maximums. Call this whenever something that
// lowers a maximum happens (removing gear or points). Returns the fields to write.
export function clampVitals(
  stats: Stats | null | undefined,
  points: Stats | null | undefined,
  equipment: Equipment | null | undefined,
  enhancements?: Enhancements | null
): Record<string, number> {
  const s = withDefaults(stats);
  if (s.health <= 0) return {};

  const t = getBreakdowns(stats, points, equipment, enhancements);
  const maxHealth = Math.max(1, t.maxHealth.total);
  const maxMana = Math.floor(Math.max(0, t.maxMana.total));

  const out: Record<string, number> = {};
  if (s.health > maxHealth) out["stats.health"] = round2(maxHealth);
  if (s.mana > maxMana) out["stats.mana"] = maxMana;
  return out;
}