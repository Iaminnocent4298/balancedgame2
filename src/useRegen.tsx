import { useEffect, useRef } from "react";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { computeRegen, getRegenTick, type RegenSubject } from "./regen";
import { getStartMs, type Room, type RoomMode } from "./rooms";

async function syncRegen(uid: string, mode: RoomMode, startMs: number) {
  const playerRef = doc(db, "players", uid);

  await runTransaction(db, async (tx) => {
    const data = (await tx.get(playerRef)).data() as
      | (RegenSubject & { roomId?: string | null })
      | undefined;
    if (!data?.roomId) return;

    const regen = computeRegen(data, getRegenTick(mode, startMs, Date.now()));
    if (!regen) return; // already collected (for example by an attack on you)

    tx.update(playerRef, {
      "stats.health": regen.health,
      "stats.mana": regen.mana,
      "stats.coins": regen.coins,
      regenTick: regen.tick,
    });
  });
}

// Collects your regen. The check each second is local only: the database is
// touched only when a new tick is actually due.
// appliedTick = the last tick saved on your player (null while still loading).
export function useRegen(uid: string, room: Room | null | undefined, appliedTick: number | null) {
  const busy = useRef(false);
  const mode = room?.mode;
  const startMs = room ? getStartMs(room) : null;

  useEffect(() => {
    if (mode === undefined || startMs === null || appliedTick === null) return;
    const roomMode: RoomMode = mode;
    const start: number = startMs;
    const applied: number = appliedTick;

    const check = () => {
      if (busy.current) return;
      if (getRegenTick(roomMode, start, Date.now()) <= applied) return; // nothing due
      busy.current = true;
      syncRegen(uid, roomMode, start)
        .catch((err) => console.error(err))
        .finally(() => {
          busy.current = false;
        });
    };

    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [uid, mode, startMs, appliedTick]);
}