import { useEffect, useMemo, useState } from "react";
import { entriesForShop, getEquippedItem } from "./catalog";
import { collectRegen } from "./collectRegen";
import type { Loadout } from "./equipment";
import CatalogTooltip from "./CatalogTooltip";
import { formatCountdown, formatNumber } from "./format";
import { getSeasonInfo } from "./gameClock";
import {
  GEAR_SLOTS, SLOTS, SPELL_SLOTS, getPrice, getSlot,
  type CatalogEntry, type Enhancement, type Expander, type Item, type SlotId,
} from "./items";
import { getRotation } from "./rotation";
import { getStartMs, type Room } from "./rooms";
import { SHOPS, type ShopId } from "./shops";
import {
  PurchaseError, checkLevel, purchase, whyCantApply,
} from "./shop";
import { splitTables } from "./splitTables";
import { describeField } from "./stats";
import { popupMessages } from "./PopupMessages";
import Tooltip from "./Tooltip";
import { usePopup, type Choice } from "./usePopup";
import { useRoomData } from "./useRoomData";

// A table longer than this gets split into side-by-side tables, up to the cap
const MAX_ROWS_PER_TABLE = 8;
const MAX_TABLES = 3;

// Wording for the two products that are applied to an item you own
const APPLY_TEXT = {
  enhancement: {
    nothing: "You don't have any gear or spells to enhance yet. Buy an item base first.",
    allBlocked: {
      reason: "slots_full",
      message: "All of your gear and spells already have the maximum number of enhancements.",
    },
    blocked: "Full",
  },
  expander: {
    nothing: "You don't have any gear or spells to expand yet. Buy an item base first.",
    allBlocked: {
      reason: "cant_expand",
      message: "None of your gear or spells can have more enhancement slots.",
    },
    blocked: "No slots",
  },
} as const;

// An item the player owns, with everything needed to show and judge it
type Owned = { slot: SlotId; item: Item; applied: string[]; extra: number };

function listOwned(loadout: Loadout): Owned[] {
  return SLOTS.flatMap(({ id: slot }) => {
    const item = getEquippedItem(loadout.equipment, slot);
    return item
      ? [
          {
            slot,
            item,
            applied: loadout.enhancements[slot] ?? [],
            extra: loadout.extraSlots[slot] ?? 0,
          },
        ]
      : [];
  });
}

type Props = { shopId: ShopId; room: Room; uid: string; onBack: () => void };

export default function ShopMenu({ shopId, room, uid, onBack }: Props) {
  const shop = SHOPS[shopId];
  const rotating = shop.rotating;
  const { showPopup, choosePopup } = usePopup();
  const { loadout: wallet } = useRoomData(); // undefined while loading
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Only rotating shops need a ticking clock (local only, no network use)
  useEffect(() => {
    if (!rotating) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [rotating]);

  const startedAt = getStartMs(room) ?? now;
  const season = getSeasonInfo(room.mode, startedAt, now);

  // What's on sale right now
  const entries = useMemo(() => {
    const all = entriesForShop(shopId);
    return rotating ? getRotation(room.id, season.seasonIndex, all, rotating.slots) : all;
  }, [shopId, rotating, room.id, season.seasonIndex]);

  if (!wallet) return <p>Loading...</p>;

  const current = wallet; // your gear and coins, already including any regen that's due
  const { coins, level } = current;
  const coinIcon = describeField("coins").icon;

  // Rechecked at the moment of purchase, in case the stock rotated while the player was deciding
  function assertOnSale(entry: CatalogEntry) {
    if (!rotating) return;
    const { seasonIndex } = getSeasonInfo(room.mode, getStartMs(room) ?? Date.now(), Date.now());
    const onSale = getRotation(room.id, seasonIndex, entriesForShop(shopId), rotating.slots);
    if (!onSale.some((e) => e.id === entry.id)) {
      throw new PurchaseError(
        "invalid",
        "That item just rotated out of the shop. Take a look at what's on sale now."
      );
    }
  }

  // Runs a purchase and turns any problem into a popup
  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      if (err instanceof PurchaseError) {
        showPopup(popupMessages.shop.failure(err.reason, err.message));
      } else {
        console.error(err);
        showPopup(popupMessages.shop.unexpectedFailure());
      }
    } finally {
      setBusy(false);
    }
  }

  // Shows the player's gear and spells as cards, and resolves with the slot they pick
  // (or null if they cancel). Row 1: weapon and armour. Row 2: spells.
  function chooseOwned(
    owned: Owned[],
    opts: {
      title: string;
      message: string;
      status: (o: Owned) => { disabled: boolean; buttonLabel: string };
    }
  ) {
    const toChoice = (o: Owned): Choice<SlotId> => ({
      value: o.slot,
      ...opts.status(o),
      label: (
        <>
          <div className="choice-slot">{getSlot(o.slot).label}</div>
          <CatalogTooltip entry={o.item} enhancements={o.applied} extraSlots={o.extra} />
        </>
      ),
    });

    const groups = [
      { title: "Gear", choices: owned.filter((o) => GEAR_SLOTS.includes(o.slot)).map(toChoice) },
      { title: "Spells", choices: owned.filter((o) => SPELL_SLOTS.includes(o.slot)).map(toChoice) },
    ].filter((g) => g.choices.length > 0);

    return choosePopup<SlotId>({ title: opts.title, message: opts.message, groups });
  }

  async function buyItem(entry: Item, price: number) {
    assertOnSale(entry);
    await collectRegen(uid, room);
    await purchase(uid, entry.id, price);
  }

  // Enhancements and expanders: check, ask which item, then pay. Cancelling charges nothing.
  async function buyApplied(entry: Enhancement | Expander, price: number) {
    assertOnSale(entry);
    const text = APPLY_TEXT[entry.kind];
    checkLevel(entry.name, entry.levelReq, current.level);

    const owned = listOwned(current);
    if (owned.length === 0) throw new PurchaseError("nothing_to_enhance", text.nothing);

    const blocked = (o: Owned) => whyCantApply(entry, o.item, o.applied.length, o.extra) !== null;
    if (owned.every(blocked)) {
      throw new PurchaseError(text.allBlocked.reason, text.allBlocked.message);
    }
    if (current.coins < price) {
      throw new PurchaseError(
        "cant_afford",
        `${entry.name} costs ${price} coins, but you can't afford that haha`
      );
    }

    const slot = await chooseOwned(owned, {
      ...popupMessages.shop.applyPrompt(entry, price),
      status: (o) =>
        blocked(o)
          ? { disabled: true, buttonLabel: text.blocked }
          : {
              disabled: false,
              buttonLabel: entry.kind === "expander" ? `Add ${entry.slots}` : "Apply here",
            },
    });
    if (!slot) return; // cancelled

    assertOnSale(entry); // the stock may have rotated while the popup was open
    await collectRegen(uid, room);
    await purchase(uid, entry.id, price, slot);
  }

  const tables = splitTables(entries, MAX_ROWS_PER_TABLE, MAX_TABLES);

  return (
    <div>
      <div className="menu-head">
        <button onClick={onBack}>← Back</button>
        <h2>{shop.title}</h2>
      </div>

      <div className="shop-info">
        <div className="box stat-coins">
          {coinIcon} Coins: <strong>{formatNumber(coins)}</strong>
        </div>
        {rotating && (
          <div className="box">
            ⏳ New stock in: <strong>{formatCountdown(season.msRemaining)}</strong>
          </div>
        )}
      </div>

      <div className="shop-tables">
        {tables.map((chunk, i) => (
          <div key={i} className="table-scroll">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Purchase</th>
                </tr>
              </thead>
              <tbody>
                {chunk.map((entry) => {
                  const price = getPrice(entry);
                  return (
                    <tr key={entry.id}>
                      <Tooltip content={<CatalogTooltip entry={entry} />}>
                        <th scope="row">
                          <span className={`rarity-${entry.rarity}`}>{entry.name}</span>
                          {entry.levelReq !== undefined && (
                            <span
                              className={`row-level${level < entry.levelReq ? " row-level-locked" : ""}`}
                            >
                              Req: ✷ {entry.levelReq}
                            </span>
                          )}
                        </th>
                      </Tooltip>
                      <td className="stat-coins">
                        {coinIcon} {formatNumber(price)}
                      </td>
                      <td>
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              entry.kind === "item"
                                ? buyItem(entry, price)
                                : buyApplied(entry, price)
                            )
                          }
                        >
                          Buy
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}