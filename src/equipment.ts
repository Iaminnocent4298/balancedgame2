import {
  deleteField, doc, getDoc, onSnapshot, runTransaction, type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { getSalvageValue, slotAccepts, type SlotId } from "./items";
import { ITEMS } from "./itemCatalog";
import { clampVitals } from "./regen";
import { DEFAULT_STATS } from "./stats";

// slot -> item id, e.g. { weapon: "iron_sword", spell1: "fireball" }. A missing slot means empty.
export type Equipment = Partial<Record<SlotId, string>>;
// slot -> enhancement ids applied to the item in that slot
export type Enhancements = Partial<Record<SlotId, string[]>>;
// slot -> the real-world time (ms since 1970) when it can be used again
export type Cooldowns = Partial<Record<SlotId, number>>;
// slot -> extra enhancement slots bought with expanders
export type ExtraSlots = Partial<Record<SlotId, number>>;

export type Loadout = {
  equipment: Equipment;
  enhancements: Enhancements;
  cooldowns: Cooldowns;
  coins: number;
  level: number;
  extraSlots: ExtraSlots;
};

function toLoadout(data: DocumentData | undefined): Loadout {
  return {
    equipment: (data?.equipment as Equipment | undefined) ?? {},
    enhancements: (data?.enhancements as Enhancements | undefined) ?? {},
    cooldowns: (data?.cooldowns as Cooldowns | undefined) ?? {},
    coins: (data?.stats?.coins as number | undefined) ?? DEFAULT_STATS.coins,
    level: (data?.stats?.level as number | undefined) ?? DEFAULT_STATS.level,
    extraSlots: (data?.extraSlots as ExtraSlots | undefined) ?? {},
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
  slot: SlotId,
  expectedItemId: string
): Promise<number> {
  const playerRef = doc(db, "players", uid);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(playerRef);
    const data = snap.data();

    const equipped = (data?.equipment as Equipment | undefined)?.[slot];
    if (equipped !== expectedItemId) throw new Error("That item is no longer equipped.");

    const item = ITEMS[expectedItemId];
    if (!item || !slotAccepts(slot, item.type)) throw new Error("That item can't be salvaged.");

    const refund = getSalvageValue(item);
    const coins = (data?.stats?.coins as number | undefined) ?? DEFAULT_STATS.coins;

    // Removing gear can lower max health or mana, so trim anything now over the max
    const nextEquipment: Equipment = { ...(data?.equipment as Equipment | undefined) };
    delete nextEquipment[slot];
    const nextEnhancements: Enhancements = { ...(data?.enhancements as Enhancements | undefined) };
    delete nextEnhancements[slot];
    const trim = clampVitals(data?.stats, data?.points, nextEquipment, nextEnhancements);

    tx.update(playerRef, {
      [`equipment.${slot}`]: deleteField(),
      [`enhancements.${slot}`]: deleteField(),
      [`extraSlots.${slot}`]: deleteField(),
      "stats.coins": coins + refund,
      ...trim,
    });
    return refund;
  });
}