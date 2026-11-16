import { deleteField } from "firebase/firestore";
import type { Cooldowns, Enhancements, Equipment, ExtraSlots } from "./equipment";
import { DEFAULT_STATS, type Stats } from "./stats";

// Everything stored on a player's document in Firestore.
// Every field is optional: the per-room ones only exist while the player is in a room.
export type PlayerDoc = {
  name?: string;
  roomId?: string | null;
  stats?: Stats;
  points?: Stats;
  pointsChangedAt?: number;
  pointsChangedLevel?: number;
  equipment?: Equipment;
  enhancements?: Enhancements;
  cooldowns?: Cooldowns;
  extraSlots?: ExtraSlots;
  regenTick?: number;
};

// ===== The per-room data: ADD A NEW PER-ROOM FIELD HERE (and to PlayerDoc above) =====
// What each field starts as when a player creates or joins a room. Leaving a room deletes
// all of them. TypeScript makes sure every PlayerDoc field except name and roomId is listed.
const ROOM_STATE_START: { [K in Exclude<keyof PlayerDoc, "name" | "roomId">]-?: () => unknown } = {
  stats: () => ({ ...DEFAULT_STATS }),
  points: () => ({}),
  pointsChangedAt: () => deleteField(), // stale from an earlier room
  pointsChangedLevel: () => deleteField(),
  equipment: () => ({}),
  enhancements: () => ({}),
  cooldowns: () => ({}),
  extraSlots: () => ({}),
  regenTick: () => 0,
};

// What to write to a player's document when they join a room
export const joinRoomFields = (roomId: string) => ({
  roomId,
  ...Object.fromEntries(Object.entries(ROOM_STATE_START).map(([key, start]) => [key, start()])),
});

// What to write when they leave
export const leaveRoomFields = () => ({
  roomId: null,
  ...Object.fromEntries(Object.keys(ROOM_STATE_START).map((key) => [key, deleteField()])),
});
