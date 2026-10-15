import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { ITEMS } from "./itemCatalog";
import { ENHANCEMENTS } from "./enhancementCatalog";
import { getItemType, getMaxEnhancements, type ItemTypeId } from "./items";
import { DEFAULT_STATS } from "./stats";
import type { Equipment } from "./equipment";

export type PurchaseFailure =
  | "cant_afford"
  | "already_owned"
  | "slots_full"
  | "nothing_to_enhance"
  | "level_too_low"
  | "invalid";

// Thrown for problems the player should be told about
export class PurchaseError extends Error {
  reason: PurchaseFailure;
  constructor(reason: PurchaseFailure, message: string) {
    super(message);
    this.reason = reason;
  }
}

function checkLevel(name: string, required: number | undefined, level: number) {
  if (required !== undefined && level < required) {
    throw new PurchaseError(
      "level_too_low",
      `${name} requires level ${required}, but you're level ${level}.`
    );
  }
}

// Checks everything, then takes the coins and fills the slot in one step,
// so you can never pay without getting the item (or get it without paying).
export async function purchaseItem(uid: string, itemId: string, price: number): Promise<void> {
  const item = ITEMS[itemId];
  if (!item) throw new PurchaseError("invalid", "That item isn't available.");

  const slot = item.type;
  const typeLabel = getItemType(slot).label;
  const playerRef = doc(db, "players", uid);

  await runTransaction(db, async (tx) => {
    const data = (await tx.get(playerRef)).data();
    const coins = (data?.stats?.coins as number | undefined) ?? DEFAULT_STATS.coins;
    const level = (data?.stats?.level as number | undefined) ?? DEFAULT_STATS.level;
    const equipment = (data?.equipment as Equipment | undefined) ?? {};

    checkLevel(item.name, item.levelReq, level);
    if (equipment[slot]) {
      throw new PurchaseError(
        "already_owned",
        `You already own a ${typeLabel}. Salvage it first if you want a new one.`
      );
    }
    if (coins < price) {
      throw new PurchaseError(
        "cant_afford",
        `${item.name} costs ${price} coins, but you only have ${coins}.`
      );
    }

    tx.update(playerRef, {
      "stats.coins": coins - price,
      [`equipment.${slot}`]: itemId,
    });
  });
}

// Applies an enhancement to the item in `slot`, re-checking everything at the moment of payment.
export async function purchaseEnhancement(
  uid: string,
  enhancementId: string,
  price: number,
  slot: ItemTypeId
): Promise<void> {
  const enhancement = ENHANCEMENTS[enhancementId];
  if (!enhancement) throw new PurchaseError("invalid", "That enhancement isn't available.");

  const playerRef = doc(db, "players", uid);

  await runTransaction(db, async (tx) => {
    const data = (await tx.get(playerRef)).data();
    const coins = (data?.stats?.coins as number | undefined) ?? DEFAULT_STATS.coins;
    const level = (data?.stats?.level as number | undefined) ?? DEFAULT_STATS.level;

    checkLevel(enhancement.name, enhancement.levelReq, level);

    const itemId = (data?.equipment as Equipment | undefined)?.[slot];
    const item = itemId ? ITEMS[itemId] : undefined;
    if (!item || item.type !== slot) {
      throw new PurchaseError("invalid", "That item is no longer equipped.");
    }

    const applied: string[] = data?.enhancements?.[slot] ?? [];
    const max = getMaxEnhancements(item);
    if (applied.length >= max) {
      throw new PurchaseError(
        "slots_full",
        `${item.name} already has the maximum of ${max} enhancements.`
      );
    }
    if (coins < price) {
      throw new PurchaseError(
        "cant_afford",
        `${enhancement.name} costs ${price} coins, but you only have ${coins}.`
      );
    }

    tx.update(playerRef, {
      "stats.coins": coins - price,
      [`enhancements.${slot}`]: [...applied, enhancementId],
    });
  });
}