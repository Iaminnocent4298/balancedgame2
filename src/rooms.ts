import {
  collection, doc, onSnapshot, query, runTransaction, serverTimestamp, deleteField, where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { DEFAULT_STATS, type Stats } from "./stats";
import type { Cooldowns, Enhancements, Equipment, ExtraSlots } from "./equipment";
import type { LogEntry } from "./log";

export const ROOM_MODES = [
  { id: "speed", label: "Speed" },
  { id: "normal", label: "Normal" },
  { id: "daily", label: "Daily" },
] as const;
export type RoomMode = (typeof ROOM_MODES)[number]["id"];

export const MIN_PLAYERS = 1; // 1 is for testing
export const MAX_PLAYERS = 8;

// Letters only, minus I and O so they can't be confused with 1 and 0.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // 24 letters
const CODE_LENGTH = 4;

export type Room = {
  id: string; // the room code
  name: string;
  mode: RoomMode;
  maxPlayers: number;
  hostId: string;
  members: Record<string, string>; // uid -> display name
  createdAt: Timestamp | null;
  log?: LogEntry[]; // newest first, at most 50
  startedAt?: Timestamp | null; // null until the host starts the game
};

// When the game started, or null if it hasn't yet.
// Rooms made before this feature have no startedAt, so they count as started at creation.
export function getStartMs(room: Room): number | null {
  if (room.startedAt === undefined) return room.createdAt?.toMillis() ?? Date.now();
  return room.startedAt ? room.startedAt.toMillis() : null;
}

class CodeTakenError extends Error {}

function generateCode(): string {
  let code = "";
  while (code.length < CODE_LENGTH) {
    const [b] = crypto.getRandomValues(new Uint8Array(1));
    // 240 = 24 * 10, so skipping higher values keeps every letter equally likely
    if (b < 240) code += CODE_CHARS[b % CODE_CHARS.length];
  }
  return code;
}

function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z]/g, "");
}

export async function createRoom(
  uid: string,
  opts: { name: string; mode: RoomMode; maxPlayers: number }
): Promise<string> {
  const roomName = opts.name.trim();
  if (roomName.length < 1 || roomName.length > 30) {
    throw new Error("Room name must be 1-30 characters.");
  }
  if (
    !Number.isInteger(opts.maxPlayers) ||
    opts.maxPlayers < MIN_PLAYERS ||
    opts.maxPlayers > MAX_PLAYERS
  ) {
    throw new Error(`Player limit must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}.`);
  }

  const playerRef = doc(db, "players", uid);

  // The code is the room's document ID. In the unlikely event of a
  // collision, try a new code.
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const roomRef = doc(db, "rooms", code);
    try {
      await runTransaction(db, async (tx) => {
        const player = await tx.get(playerRef);
        const existing = await tx.get(roomRef);

        if (player.data()?.roomId) throw new Error("You're already in a room.");
        if (existing.exists()) throw new CodeTakenError();

        tx.set(roomRef, {
          name: roomName,
          mode: opts.mode,
          maxPlayers: opts.maxPlayers,
          hostId: uid,
          members: { [uid]: player.data()?.name ?? "Player" },
          createdAt: serverTimestamp(),
          startedAt: null,
        });
        tx.update(playerRef, {
          roomId: code,
          stats: { ...DEFAULT_STATS },
          points: {},
          equipment: {},
          enhancements: {},
          cooldowns: {},
          extraSlots: {},
          regenTick: 0,
        });
      });
      return code;
    } catch (err) {
      if (err instanceof CodeTakenError) continue;
      throw err;
    }
  }
  throw new Error("Couldn't generate a room code. Please try again.");
}

export async function joinRoom(uid: string, rawCode: string) {
  const code = normalizeCode(rawCode);
  if (code.length !== CODE_LENGTH) {
    throw new Error(`Room codes are ${CODE_LENGTH} characters long.`);
  }

  const playerRef = doc(db, "players", uid);
  const roomRef = doc(db, "rooms", code);

  await runTransaction(db, async (tx) => {
    const player = await tx.get(playerRef);
    const room = await tx.get(roomRef);

    if (player.data()?.roomId) throw new Error("You're already in a room.");
    if (!room.exists()) throw new Error("No room found with that code.");
    if (room.data().startedAt !== null) {
      throw new Error("That game has already started, so it can't be joined.");
    }
    if (Object.keys(room.data().members).length >= room.data().maxPlayers) {
      throw new Error("That room is full.");
    }

    tx.update(roomRef, { [`members.${uid}`]: player.data()?.name ?? "Player" });
    tx.update(playerRef, {
      roomId: code,
      stats: { ...DEFAULT_STATS },
      points: {},
      equipment: {},
      enhancements: {},
      cooldowns: {},
      extraSlots: {},
      regenTick: 0,
    });
  });
}

export async function leaveRoom(uid: string) {
  const playerRef = doc(db, "players", uid);

  await runTransaction(db, async (tx) => {
    const player = await tx.get(playerRef);
    const roomId = player.data()?.roomId;
    if (!roomId) return;

    const roomRef = doc(db, "rooms", roomId);
    const room = await tx.get(roomRef);

    if (room.exists()) {
      const remaining = Object.keys(room.data().members).filter((id) => id !== uid);
      if (remaining.length === 0) {
        tx.delete(roomRef); // last one out closes the room
      } else {
        tx.update(roomRef, {
          [`members.${uid}`]: deleteField(),
          // if the host leaves, hand the host role to someone else
          ...(room.data().hostId === uid ? { hostId: remaining[0] } : {}),
        });
      }
    }
    tx.update(playerRef, {
      roomId: null,
      stats: deleteField(),
      points: deleteField(),
      equipment: deleteField(),
      enhancements: deleteField(),
      cooldowns: deleteField(),
      regenTick: deleteField(),
      extraSlots: deleteField(),
    });
  });
}

export function subscribeToRoom(roomId: string, onChange: (room: Room | null) => void) {
  return onSnapshot(doc(db, "rooms", roomId), (snap) =>
    onChange(
      snap.exists()
        ? { id: snap.id, ...(snap.data({ serverTimestamps: "estimate" }) as Omit<Room, "id">) }
        : null
    )
  );
}

export type RoomPlayer = {
  id: string;
  name: string;
  stats: Stats | null;
  points: Stats | null;
  equipment: Equipment | null;
  enhancements: Enhancements | null;
  cooldowns: Cooldowns | null;
  extraSlots: ExtraSlots | null;
  regenTick: number | null;
};

// Live list of everyone whose roomId matches this room's code
export function subscribeToRoomPlayers(
  roomId: string,
  onChange: (players: RoomPlayer[]) => void
) {
  const q = query(collection(db, "players"), where("roomId", "==", roomId));
  return onSnapshot(q, (snap) =>
    onChange(
      snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name ?? "Player",
        stats: (d.data().stats as Stats | undefined) ?? null,
        points: (d.data().points as Stats | undefined) ?? null,
        equipment: (d.data().equipment as Equipment | undefined) ?? null,
        enhancements: (d.data().enhancements as Enhancements | undefined) ?? null,
        cooldowns: (d.data().cooldowns as Cooldowns | undefined) ?? null,
        extraSlots: (d.data().extraSlots as ExtraSlots | undefined) ?? null,
        regenTick: (d.data().regenTick as number | undefined) ?? null,
      }))
    )
  );
}

// Only the host can start, and only once
export async function startGame(uid: string, roomId: string) {
  const roomRef = doc(db, "rooms", roomId);

  await runTransaction(db, async (tx) => {
    const room = await tx.get(roomRef);
    if (!room.exists()) throw new Error("This room no longer exists.");

    const data = room.data();
    if (data.hostId !== uid) throw new Error("Only the host can start the game.");
    if (data.startedAt !== null) throw new Error("The game has already started.");

    tx.update(roomRef, { startedAt: serverTimestamp() });
  });
}

// ADMIN ONLY: every room that exists right now. Firestore refuses this for everyone else.
export function subscribeToAllRooms(
  onChange: (rooms: Room[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, "rooms"),
    (snap) =>
      onChange(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data({ serverTimestamps: "estimate" }) as Omit<Room, "id">),
        }))
      ),
    (err) => onError?.(err)
  );
}