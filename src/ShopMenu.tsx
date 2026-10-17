import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ENHANCEMENTS } from "./enhancementCatalog";
import type { Enhancement } from "./enhancements";
import { getLoadout, subscribeToLoadout, type Loadout } from "./equipment";
import { EXPANDERS, type Expander } from "./expanderCatalog";
import { formatCountdown } from "./format";
import { getSeasonInfo } from "./gameClock";
import { ITEMS } from "./itemCatalog";
import {
  GEAR_SLOTS, SLOTS, SPELL_SLOTS, canExpandSlots, getItemType, getMaxEnhancements, getRarity,
  getSlot, slotAccepts, type Item, type RarityId, type SlotId,
} from "./items";
import ItemTooltip from "./ItemTooltip";
import { getRotation } from "./rotation";
import { getStartMs, type Room } from "./rooms";
import {
  SHOPS, entryKey, getPrice, isRotating, type Shop, type ShopEntry, type ShopId,
} from "./shopCatalog";
import {
  PurchaseError, purchaseEnhancement, purchaseExpander, purchaseItem, type PurchaseFailure,
} from "./shop";
import { describeField } from "./stats";
import StatList from "./StatList";
import Tooltip from "./Tooltip";
import { usePopup, type Choice } from "./usePopup";
import { splitTables } from "./splitTables";

const round = (v: number) => String(Math.round(v * 100) / 100);

// A table longer than this gets split into side-by-side tables, up to the cap
const MAX_ROWS_PER_TABLE = 8;
const MAX_TABLES = 3;

const FAILURE_TITLES: Record<PurchaseFailure, string> = {
  cant_afford: "You're too broke for that LMAO",
  already_owned: "Duplication glitch patched",
  no_free_slot: "The greed they talk about in the bible",
  slots_full: "Too much magic!",
  nothing_to_enhance: "You can't enhance yourself-",
  cant_expand: "Too powerful!",
  level_too_low: "Still early game L",
  invalid: "Searching for an item that doesn't exist",
};

type Row = {
  key: string;
  name: string;
  tag: string; // small label under the name
  levelReq?: number; // shown under the name when present
  rarity: RarityId;
  tooltip: ReactNode;
  price: number;
  buy: () => Promise<void>;
};

// An item the player owns, with everything needed to show and judge it
type Owned = { slot: SlotId; item: Item; applied: string[]; extra: number };

function listOwned(loadout: Loadout): Owned[] {
  return SLOTS.flatMap(({ id: slot }) => {
    const itemId = loadout.equipment[slot];
    const item = itemId ? ITEMS[itemId] : undefined;
    return item && slotAccepts(slot, item.type)
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

function EnhancementTip({ enhancement }: { enhancement: Enhancement }) {
  return (
    <div className="item-tip">
      <div className={`item-name rarity-${enhancement.rarity}`}>{enhancement.name}</div>
      <div className={`item-rarity rarity-${enhancement.rarity}`}>
        {getRarity(enhancement.rarity).label} Enhancement
      </div>
      {enhancement.levelReq !== undefined && <div className="stat-level">Req: ✷ {enhancement.levelReq}</div>}
      <StatList stats={enhancement.stats} />
      {enhancement.description && <p className="item-desc">{enhancement.description}</p>}
      <div className="item-value stat-coins">Value: {round(enhancement.value)} coins</div>
    </div>
  );
}

function ExpanderTip({ expander }: { expander: Expander }) {
  return (
    <div className="item-tip">
      <div className={`item-name rarity-${expander.rarity}`}>{expander.name}</div>
      {expander.levelReq !== undefined && <div className="stat-level">Req: ✷ {expander.levelReq}</div>}
      {expander.description && <p className="item-desc">{expander.description}</p>}
      <div className={`item-rarity rarity-${expander.rarity}`}>
        {getRarity(expander.rarity).label} Enhancement Expander
      </div>
      <div className="item-value stat-coins">Value: {round(expander.value)} coins</div>
    </div>
  );
}

type Props = { shopId: ShopId; room: Room; uid: string; onBack: () => void };

export default function ShopMenu({ shopId, room, uid, onBack }: Props) {
  const shop: Shop = SHOPS[shopId];
  const rotating = isRotating(shop);
  const { showPopup, choosePopup } = usePopup();
  // undefined = still loading
  const [wallet, setWallet] = useState<Loadout | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => subscribeToLoadout(uid, setWallet), [uid]);

  // Only rotating shops need a ticking clock (local only, no network use)
  useEffect(() => {
    if (!rotating) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [rotating]);

  const startedAt = getStartMs(room) ?? now;
  const season = getSeasonInfo(room.mode, startedAt, now);

  // What's on sale right now
  const entries = useMemo(
    () =>
      isRotating(shop)
        ? getRotation(room.id, season.seasonIndex, shop.pool, shop.slots)
        : shop.entries,
    [shop, room.id, season.seasonIndex]
  );

  if (!wallet) return <p>Loading...</p>;

  const { coins, level } = wallet;
  const coinIcon = describeField("coins").icon;

  // Rechecked at the moment of purchase, in case the stock rotated while the player was deciding
  function assertOnSale(entry: ShopEntry) {
    if (!isRotating(shop)) return;
    const start = getStartMs(room) ?? Date.now();
    const { seasonIndex } = getSeasonInfo(room.mode, start, Date.now());
    const onSale = getRotation(room.id, seasonIndex, shop.pool, shop.slots);
    if (!onSale.some((e) => entryKey(e) === entryKey(entry))) {
      throw new PurchaseError(
        "invalid",
        "You missed the sale, and now that item is gone... for now."
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
        showPopup({ title: FAILURE_TITLES[err.reason], message: err.message });
      } else {
        console.error(err);
        showPopup({ title: "Couldn't buy", message: "Something went wrong. Please contact @iaminnocent4298 if this problem persists." });
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
          <ItemTooltip item={o.item} enhancements={o.applied} extraSlots={o.extra} />
        </>
      ),
    });

    const groups = [
      { title: "Gear", choices: owned.filter((o) => GEAR_SLOTS.includes(o.slot)).map(toChoice) },
      { title: "Spells", choices: owned.filter((o) => SPELL_SLOTS.includes(o.slot)).map(toChoice) },
    ].filter((g) => g.choices.length > 0);

    return choosePopup<SlotId>({ title: opts.title, message: opts.message, groups });
  }

  // Check, ask which item to enhance, then pay. Cancelling the popup charges nothing.
  async function buyEnhancement(entry: ShopEntry, price: number) {
    assertOnSale(entry);
    const enhancement = ENHANCEMENTS[entry.id];
    const loadout = await getLoadout(uid);

    if (enhancement.levelReq !== undefined && loadout.level < enhancement.levelReq) {
      throw new PurchaseError(
        "level_too_low",
        `${enhancement.name} requires level ${enhancement.levelReq}, but clearly you can't read`
      );
    }

    const owned = listOwned(loadout);
    if (owned.length === 0) {
      throw new PurchaseError(
        "nothing_to_enhance",
        "You can't enhance anything... because you don't own anything LMAO"
      );
    }
    if (loadout.coins < price) {
      throw new PurchaseError(
        "cant_afford",
        `${enhancement.name} costs ${price} coins, but you can't afford that haha`
      );
    }
    const isFull = (o: Owned) => o.applied.length >= getMaxEnhancements(o.item, o.extra);
    if (owned.every(isFull)) {
      throw new PurchaseError(
        "slots_full",
        "Oopsies! Everything's hypermaxed already. How have you not won the game yet?"
      );
    }

    const slot = await chooseOwned(owned, {
      title: `Apply ${enhancement.name} (\$ ${price})`,
      message: `Select the gear or spell to enhance.`,
      status: (o) => ({
        disabled: isFull(o),
        buttonLabel: isFull(o) ? "Full" : "Apply here",
      }),
    });
    if (!slot) return; // cancelled

    assertOnSale(entry); // the stock may have rotated while the popup was open
    await purchaseEnhancement(uid, entry.id, price, slot);
  }

  // Same flow for expanders: items that have no enhancement slots can't be picked
  async function buyExpander(entry: ShopEntry, price: number) {
    assertOnSale(entry);
    const expander = EXPANDERS[entry.id];
    const loadout = await getLoadout(uid);

    if (expander.levelReq !== undefined && loadout.level < expander.levelReq) {
      throw new PurchaseError(
        "level_too_low",
        `${expander.name} requires level ${expander.levelReq}, but clearly you can't read`
      );
    }

    const owned = listOwned(loadout);
    if (owned.length === 0) {
      throw new PurchaseError(
        "nothing_to_enhance",
        "You can't enhance anything... because you don't own anything LMAO"
      );
    }
    if (!owned.some((o) => canExpandSlots(o.item))) {
      throw new PurchaseError(
        "cant_expand",
        "Oh no, you used up all of your items' magical powers. What will you do now?"
      );
    }
    if (loadout.coins < price) {
      throw new PurchaseError(
        "cant_afford",
        `${expander.name} costs ${price} coins, but you can't afford that haha`
      );
    }

    const slot = await chooseOwned(owned, {
      title: `Apply ${expander.name} (\$ ${price})`,
      message:
        `Pick the gear or spell to expand.` +
        `slot${expander.slots === 1 ? "" : "s"}`,
      status: (o) =>
        canExpandSlots(o.item)
          ? { disabled: false, buttonLabel: `Add ${expander.slots}` }
          : { disabled: true, buttonLabel: "No slots" },
    });
    if (!slot) return; // cancelled

    assertOnSale(entry);
    await purchaseExpander(uid, entry.id, price, slot);
  }

  const rows: Row[] = entries.map((entry) => {
    const price = getPrice(entry);

    if (entry.kind === "item") {
      const item = ITEMS[entry.id];
      return {
        key: entryKey(entry),
        name: item.name,
        tag: getItemType(item.type).label,
        levelReq: item.levelReq,
        rarity: item.rarity,
        tooltip: <ItemTooltip item={item} />,
        price,
        buy: async () => {
          assertOnSale(entry);
          await purchaseItem(uid, entry.id, price);
        },
      };
    }

    if (entry.kind === "enhancement") {
      const enhancement = ENHANCEMENTS[entry.id];
      return {
        key: entryKey(entry),
        name: enhancement.name,
        tag: "Enhancement",
        levelReq: enhancement.levelReq,
        rarity: enhancement.rarity,
        tooltip: <EnhancementTip enhancement={enhancement} />,
        price,
        buy: () => buyEnhancement(entry, price),
      };
    }

    const expander = EXPANDERS[entry.id];
    return {
      key: entryKey(entry),
      name: expander.name,
      tag: "Enhancement Expander",
      levelReq: expander.levelReq,
      rarity: expander.rarity,
      tooltip: <ExpanderTip expander={expander} />,
      price,
      buy: () => buyExpander(entry, price),
    };
  });

  const tables = splitTables(rows, MAX_ROWS_PER_TABLE, MAX_TABLES);

  return (
    <div>
      <div className="menu-head">
        <button onClick={onBack}>← Back</button>
        <h2>{shop.title}</h2>
      </div>

      <div className="shop-info">
        <div className="box stat-coins">
          {coinIcon} Coins: <strong>{round(coins)}</strong>
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
                {chunk.map((row) => (
                  <tr key={row.key}>
                    <Tooltip content={row.tooltip}>
                      <th scope="row">
                        <span className={`rarity-${row.rarity}`}>{row.name}</span>
                        {row.levelReq !== undefined && (
                          <span
                            className={`row-level${level < row.levelReq ? " row-level-locked" : ""}`}
                          >
                            Req: ✷ {row.levelReq}
                          </span>
                        )}
                      </th>
                    </Tooltip>
                    <td className="stat-coins">
                      {coinIcon} {round(row.price)}
                    </td>
                    <td>
                      <button disabled={busy} onClick={() => run(row.buy)}>
                        Buy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}