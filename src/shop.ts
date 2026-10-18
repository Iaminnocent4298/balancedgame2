import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { CATALOG_BY_ID, getEquippedItem } from "./catalog";
import type { Equipment } from "./equipment";
import {
  canExpandSlots, getItemType, getMaxEnhancements, slotsFor,
  type Enhancement, type Expander, type Item, type SlotId,
} from "./items";
import { DEFAULT_STATS } from "./stats";

export type PurchaseFailure =
  | "cant_afford"
  | "already_owned"
  | "no_free_slot"
  | "slots_full"
  | "nothing_to_enhance"
  | "cant_expand"
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

export function checkLevel(name: string, required: number | undefined, level: number) {
  if (required !== undefined && level < required) {
    throw new PurchaseError(
      "level_too_low",
      `${name} requires level ${required}, but clearly you can't read`
    );
  }
}

// Why an enhancement or expander can't go on this item right now (null = it can).
// Used both to grey out cards in the chooser and to refuse at the moment of payment.
export function whyCantApply(
  entry: Enhancement | Expander,
  item: Item,
  appliedCount: number,
  extraSlots: number
): PurchaseError | null {
  if (entry.kind === "enhancement") {
    const max = getMaxEnhancements(item, extraSlots);
    return appliedCount >= max
      ? new PurchaseError("slots_full", `You've already maxed ${item.name}. Not hypermaxed though ;)`)
      : null;
  }
  return canExpandSlots(item)
    ? null
    : new PurchaseError(
        "cant_expand",
        `You can't use an expander on an item with no enhancement slots... sorry!`
      );
}

// Buys one thing. Everything is re-checked in the same step that takes the coins,
// so you can never pay without getting it (or get it without paying).
//  - item: goes in the first free slot of its type (`slot` is ignored)
//  - enhancement or expander: `slot` is the equipped item it's applied to
export async function purchase(
  uid: string,
  id: string,
  price: number,
  slot?: SlotId
): Promise<void> {
  const entry = CATALOG_BY_ID[id];
  if (!entry) throw new PurchaseError("invalid", "That isn't available.");

  const playerRef = doc(db, "players", uid);

  await runTransaction(db, async (tx) => {
    const data = (await tx.get(playerRef)).data();
    const coins = (data?.stats?.coins as number | undefined) ?? DEFAULT_STATS.coins;
    const level = (data?.stats?.level as number | undefined) ?? DEFAULT_STATS.level;
    const equipment = (data?.equipment as Equipment | undefined) ?? {};

    checkLevel(entry.name, entry.levelReq, level);

    // What this purchase changes besides the coins
    let change: Record<string, unknown>;

    if (entry.kind === "item") {
      const candidates = slotsFor(entry.type);
      const free = candidates.find((s) => !equipment[s]);
      if (!free) {
        throw candidates.length === 1
          ? new PurchaseError(
              "already_owned",
              `You already own this item. Why do you need another one?`
            )
          : new PurchaseError(
              "no_free_slot",
              `You already have max spells. Save some for the rest of us :c`
            );
      }
      change = { [`equipment.${free}`]: entry.id };
    } else {
      if (!slot) throw new PurchaseError("invalid", "Pick an item to apply it to.");
      const item = getEquippedItem(equipment, slot);
      if (!item) throw new PurchaseError("invalid", "That item is no longer equipped.");

      const applied: string[] = data?.enhancements?.[slot] ?? [];
      const extra = (data?.extraSlots?.[slot] as number | undefined) ?? 0;
      const blocked = whyCantApply(entry, item, applied.length, extra);
      if (blocked) throw blocked;

      change =
        entry.kind === "enhancement"
          ? { [`enhancements.${slot}`]: [...applied, entry.id] }
          : { [`extraSlots.${slot}`]: extra + entry.slots };
    }

    if (coins < price) {
      throw new PurchaseError(
        "cant_afford",
        `${entry.name} costs ${price} coins, but you can't afford that haha`
      );
    }

    tx.update(playerRef, { "stats.coins": coins - price, ...change });
  });
}