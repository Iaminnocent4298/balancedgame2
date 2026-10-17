import { createContext, useContext } from "react";
import type { Loadout } from "./equipment";
import type { Room, RoomPlayer } from "./rooms";

export type RoomData = {
  room: Room | null | undefined; // undefined = loading, null = doesn't exist
  players: RoomPlayer[] | undefined; // undefined = loading. Health, mana, and coins are already up to date
  me: RoomPlayer | undefined; // your own entry (not present for a spectating admin)
  loadout: Loadout | undefined; // your gear, cooldowns, coins, and level
};

export const RoomDataContext = createContext<RoomData | null>(null);

export function useRoomData(): RoomData {
  const ctx = useContext(RoomDataContext);
  if (!ctx) throw new Error("useRoomData must be used inside <RoomDataProvider>");
  return ctx;
}