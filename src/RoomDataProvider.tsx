import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Loadout } from "./equipment";
import { computeRegen, getRegenTick } from "./regen";
import {
  getStartMs, subscribeToRoom, subscribeToRoomPlayers,
  type Room, type RoomMode, type RoomPlayer,
} from "./rooms";
import { withDefaults } from "./stats";
import { RoomDataContext, type RoomData } from "./useRoomData";

function loadoutFromPlayer(p: RoomPlayer): Loadout {
  const stats = withDefaults(p.stats);
  return {
    equipment: p.equipment ?? {},
    enhancements: p.enhancements ?? {},
    extraSlots: p.extraSlots ?? {},
    cooldowns: p.cooldowns ?? {},
    coins: stats.coins,
    level: stats.level,
  };
}

type Props = { roomId: string; uid: string; children: ReactNode };

// The ONLY database listeners for a room screen. Everything else reads from here.
export default function RoomDataProvider({ roomId, uid, children }: Props) {
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [stored, setStored] = useState<RoomPlayer[] | undefined>(undefined);
  const [tick, setTick] = useState(0);

  useEffect(() => subscribeToRoom(roomId, setRoom), [roomId]);
  useEffect(() => subscribeToRoomPlayers(roomId, setStored), [roomId]);

  const mode: RoomMode | undefined = room ? room.mode : undefined;
  const startMs = room ? getStartMs(room) : null;

  // Which regen tick we're on. Local only: it re-renders things only when a new tick arrives
  useEffect(() => {
    if (mode === undefined || startMs === null) return;
    const m: RoomMode = mode;
    const s: number = startMs;
    const update = () => setTick(getRegenTick(m, s, Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [mode, startMs]);

  const currentTick = startMs === null ? 0 : tick;

  // Each player's health, mana, and coins with any regen that's due already applied
  const players = useMemo(
    () =>
      stored?.map((p) => {
        const regen = computeRegen(p, currentTick);
        if (!regen) return p;
        return {
          ...p,
          stats: {
            ...withDefaults(p.stats),
            health: regen.health,
            mana: regen.mana,
            coins: regen.coins,
          },
        };
      }),
    [stored, currentTick]
  );

  const value = useMemo<RoomData>(() => {
    const me = players?.find((p) => p.id === uid);
    return { room, players, me, loadout: me ? loadoutFromPlayer(me) : undefined };
  }, [room, players, uid]);

  return <RoomDataContext.Provider value={value}>{children}</RoomDataContext.Provider>;
}