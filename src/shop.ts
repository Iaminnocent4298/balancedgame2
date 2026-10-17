import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { ITEMS } from "./itemCatalog";
import { ENHANCEMENTS } from "./enhancementCatalog";
import { canExpandSlots, getItemType, getMaxEnhancements, slotAccepts, slotsFor, type SlotId } from "./items";
import { EXPANDERS } from "./expanderCatalog";
import { DEFAULT_STATS } from "./stats";
import type { Equipment } from "./equipment";

export type PurchaseFailure =
  | "cant_afford"
  | "already_owned"
  | "no_free_slot"
  | "slots_full"
  | "nothing_to_enhance"
  | "level_too_low"
  | "invalid"
  | "cant_expand";

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

// Checks everything, then takes the coins and fills a slot in one step,
// so you can never pay without getting the item (or get it without paying).
// Weapons and armour: one per type. Spells go in the first empty spell slot.
export async function purchaseItem(uid: string, itemId: string, price: number): Promise<void> {
  const item = ITEMS[itemId];
  if (!item) throw new PurchaseError("invalid", "That item isn't available.");

  const typeLabel = getItemType(item.type).label;
  const candidates = slotsFor(item.type);
  const playerRef = doc(db, "players", uid);

  await runTransaction(db, async (tx) => {
    const data = (await tx.get(playerRef)).data();
    const coins = (data?.stats?.coins as number | undefined) ?? DEFAULT_STATS.coins;
    const level = (data?.stats?.level as number | undefined) ?? DEFAULT_STATS.level;
    const equipment = (data?.equipment as Equipment | undefined) ?? {};

    checkLevel(item.name, item.levelReq, level);

    const slot = candidates.find((s) => !equipment[s]);
    if (!slot) {
      throw candidates.length === 1
        ? new PurchaseError(
            "already_owned",
            `You already own a ${typeLabel}. Duplicate items do not in fact give double stats`
          )
        : new PurchaseError(
            "no_free_slot",
            `All ${candidates.length} of your spell slots are full. How are you gonna mana sustain a 5th spell?`
          );
    }
    if (coins < price) {
      throw new PurchaseError(
        "cant_afford",
        `${item.name} costs ${price} coins, but you can't afford that haha`
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
  slot: SlotId
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
    if (!item || !slotAccepts(slot, item.type)) {
      throw new PurchaseError("invalid", "That item is no longer equipped.");
    }

    const applied: string[] = data?.enhancements?.[slot] ?? [];
    const max = getMaxEnhancements(item, (data?.extraSlots?.[slot] as number | undefined) ?? 0);
    if (applied.length >= max) {
      throw new PurchaseError(
        "slots_full",
        `${item.name} is already hypermaxed! Skill issue if you didn't add the right enhancements`
      );
    }
    if (coins < price) {
      throw new PurchaseError(
        "cant_afford",
        `${enhancement.name} costs ${price} coins, but you can't afford that haha`
      );
    }

    tx.update(playerRef, {
      "stats.coins": coins - price,
      [`enhancements.${slot}`]: [...applied, enhancementId],
    });
  });
}

// Adds the expander's enhancement slots to the item in `slot`
export async function purchaseExpander(
  uid: string,
  expanderId: string,
  price: number,
  slot: SlotId
): Promise<void> {
  const expander = EXPANDERS[expanderId];
  if (!expander) throw new PurchaseError("invalid", "That expander isn't available.");

  const playerRef = doc(db, "players", uid);

  await runTransaction(db, async (tx) => {
    const data = (await tx.get(playerRef)).data();
    const coins = (data?.stats?.coins as number | undefined) ?? DEFAULT_STATS.coins;
    const level = (data?.stats?.level as number | undefined) ?? DEFAULT_STATS.level;

    checkLevel(expander.name, expander.levelReq, level);

    const itemId = (data?.equipment as Equipment | undefined)?.[slot];
    const item = itemId ? ITEMS[itemId] : undefined;
    if (!item || !slotAccepts(slot, item.type)) {
      throw new PurchaseError("invalid", "That item is no longer equipped.");
    }
    if (!canExpandSlots(item)) {
      throw new PurchaseError(
        "cant_expand",
        `${item.name} has no enhancement slots`
      );
    }
    if (coins < price) {
      throw new PurchaseError(
        "cant_afford",
        `${expander.name} costs ${price} coins, but you can't afford that haha`
      );
    }

    const extra = (data?.extraSlots?.[slot] as number | undefined) ?? 0;
    tx.update(playerRef, {
      "stats.coins": coins - price,
      [`extraSlots.${slot}`]: extra + expander.slots,
    });
  });
}