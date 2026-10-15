import {
  deleteField, doc, getDoc, onSnapshot, runTransaction, type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { getSalvageValue, type ItemTypeId } from "./items";
import { ITEMS } from "./itemCatalog";
import { DEFAULT_STATS } from "./stats";

// slot -> item id, e.g. { weapon: "iron_sword" }. A missing slot means empty.
export type Equipment = Partial<Record<ItemTypeId, string>>;
// slot -> enhancement ids applied to the item in that slot, e.g. { weapon: ["sharpness"] }
export type Enhancements = Partial<Record<ItemTypeId, string[]>>;

export type Loadout = { equipment: Equipment; enhancements: Enhancements; coins: number };

function toLoadout(data: DocumentData | undefined): Loadout {
  return {
    equipment: (data?.equipment as Equipment | undefined) ?? {},
    enhancements: (data?.enhancements as Enhancements | undefined) ?? {},
    coins: (data?.stats?.coins as number | undefined) ?? DEFAULT_STATS.coins,
  };
}

export function subscribeToLoadout(uid: string, onChange: (loadout: Loadout) => void) {
  return onSnapshot(doc(db, "players", uid), (snap) => onChange(toLoadout(snap.data())));
}

// One-time read (used before opening the enhancement chooser)
export async function getLoadout(uid: string): Promise<Loadout> {
  return toLoadout((await getDoc(doc(db, "players", uid))).data());
}

// Empties the slot (and its enhancements) and pays the player in one step.
// Returns the coins received.
export async function salvageItem(
  uid: string,
  slot: ItemTypeId,
  expectedItemId: string
): Promise<number> {
  const playerRef = doc(db, "players", uid);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(playerRef);
    const data = snap.data();

    const equipped = (data?.equipment as Equipment | undefined)?.[slot];
    if (equipped !== expectedItemId) throw new Error("That item is no longer equipped.");

    const item = ITEMS[expectedItemId];
    if (!item || item.type !== slot) throw new Error("That item can't be salvaged.");

    const refund = getSalvageValue(item);
    const coins = (data?.stats?.coins as number | undefined) ?? DEFAULT_STATS.coins;

    tx.update(playerRef, {
      [`equipment.${slot}`]: deleteField(),
      [`enhancements.${slot}`]: deleteField(),
      "stats.coins": coins + refund,
    });
    return refund;
  });
}