import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { DEFAULT_STATS, POINT_RATES, type Stats } from "./stats";
import type { Enhancements, Equipment } from "./equipment";
import { clampVitals } from "./regen";
import { DAY_LENGTH_MS } from "./gameClock";
import type { RoomMode } from "./rooms";

export type PointsState = {
  available: number; // unspent ability points
  spent: Stats; // field -> AP spent in it
  stats: Stats | null; // base stats (for the live totals)
  equipment: Equipment | null;
  enhancements: Enhancements | null;
};

export function getPointsChangeCooldownUntil(
  lastChangedAt: number | undefined,
  lastChangedLevel: number | undefined,
  currentLevel: number,
  mode: RoomMode
): number {
  if (lastChangedAt === undefined || currentLevel > (lastChangedLevel ?? currentLevel)) return 0;
  return lastChangedAt + DAY_LENGTH_MS[mode];
}

export async function confirmPoints(
  uid: string,
  nextPoints: Stats,
  mode: RoomMode
): Promise<void> {
  for (const [field, value] of Object.entries(nextPoints)) {
    if (!(field in POINT_RATES) || !Number.isInteger(value) || value < 0) {
      throw new Error("The ability point allocation is invalid.");
    }
  }

  const playerRef = doc(db, "players", uid);

  await runTransaction(db, async (tx) => {
    const data = (await tx.get(playerRef)).data();
    const available = (data?.stats?.abilityPoints as number | undefined) ?? DEFAULT_STATS.abilityPoints;
    const currentPoints = (data?.points as Stats | undefined) ?? {};
    const currentLevel = (data?.stats?.level as number | undefined) ?? DEFAULT_STATS.level;
    const lastChangedAt = data?.pointsChangedAt as number | undefined;
    const lastChangedLevel = data?.pointsChangedLevel as number | undefined;
    const cooldownUntil = getPointsChangeCooldownUntil(
      lastChangedAt,
      lastChangedLevel,
      currentLevel,
      mode
    );

    if (Date.now() < cooldownUntil) {
      throw new Error("You can only change your spec once per in-game day, unless you level up.");
    }

    const pointsToWrite: Record<string, number> = {};
    let pointDelta = 0;
    let hasChanges = false;
    for (const field of Object.keys(POINT_RATES)) {
      const current = currentPoints[field] ?? 0;
      const next = nextPoints[field] ?? 0;
      if (next !== current) hasChanges = true;
      pointDelta += next - current;
      pointsToWrite[`points.${field}`] = next;
    }
    if (!hasChanges) return;
    if (pointDelta > available) throw new Error("You don't have enough ability points.");

    const trim = clampVitals(
      data?.stats,
      nextPoints,
      data?.equipment,
      data?.enhancements
    );

    tx.update(playerRef, {
      "stats.abilityPoints": available - pointDelta,
      ...pointsToWrite,
      pointsChangedAt: Date.now(),
      pointsChangedLevel: currentLevel,
      ...trim,
    });
  });
}