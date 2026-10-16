import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { DEFAULT_STATS, POINT_RATES, type Stats } from "./stats";
import type { Enhancements, Equipment } from "./equipment";
import { clampVitals } from "./regen";

export type PointsState = {
  available: number; // unspent ability points
  spent: Stats; // field -> AP spent in it
  stats: Stats | null; // base stats (for the live totals)
  equipment: Equipment | null;
  enhancements: Enhancements | null;
};

export function subscribeToPoints(uid: string, onChange: (state: PointsState) => void) {
  return onSnapshot(doc(db, "players", uid), (snap) => {
    const data = snap.data();
    onChange({
      available: (data?.stats?.abilityPoints as number | undefined) ?? DEFAULT_STATS.abilityPoints,
      spent: (data?.points as Stats | undefined) ?? {},
      stats: (data?.stats as Stats | undefined) ?? null,
      equipment: (data?.equipment as Equipment | undefined) ?? null,
      enhancements: (data?.enhancements as Enhancements | undefined) ?? null,
    });
  });
}

// delta > 0 spends AP into a stat, delta < 0 takes AP back out.
// Returns false (and changes nothing) if it isn't possible.
export async function changePoints(uid: string, field: string, delta: number): Promise<boolean> {
  if (!(field in POINT_RATES) || !Number.isInteger(delta) || delta === 0) return false;
  const playerRef = doc(db, "players", uid);

  return runTransaction(db, async (tx) => {
    const data = (await tx.get(playerRef)).data();
    const available = (data?.stats?.abilityPoints as number | undefined) ?? DEFAULT_STATS.abilityPoints;
    const spent = (data?.points?.[field] as number | undefined) ?? 0;

    if (delta > 0 && available < delta) return false; // not enough AP
    if (delta < 0 && spent < -delta) return false; // can't go below 0 in a stat

    // Taking points out of max health or max mana can leave the current value over the max
    const trim = clampVitals(
      data?.stats,
      { ...(data?.points as Stats | undefined), [field]: spent + delta },
      data?.equipment,
      data?.enhancements
    );

    tx.update(playerRef, {
      "stats.abilityPoints": available - delta,
      [`points.${field}`]: spent + delta,
      ...trim,
    });
    return true;
  });
}