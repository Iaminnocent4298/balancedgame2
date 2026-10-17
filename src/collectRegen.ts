import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { computeRegen, getRegenTick, type RegenSubject } from "./regen";
import { getStartMs, type Room } from "./rooms";

// Saves the health, mana, and coin ticks you've earned but haven't been paid yet.
// Call it right before spending coins. If nothing is due, it writes nothing.
export async function collectRegen(uid: string, room: Room): Promise<void> {
  const startMs = getStartMs(room);
  if (startMs === null) return;

  const playerRef = doc(db, "players", uid);
  await runTransaction(db, async (tx) => {
    const data = (await tx.get(playerRef)).data() as
      | (RegenSubject & { roomId?: string | null })
      | undefined;
    if (!data?.roomId) return;

    const regen = computeRegen(data, getRegenTick(room.mode, startMs, Date.now()));
    if (!regen) return;

    tx.update(playerRef, {
      "stats.health": regen.health,
      "stats.mana": regen.mana,
      "stats.coins": regen.coins,
      regenTick: regen.tick,
    });
  });
}