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

const round = (v: number) => String(Math.round(v * 100) / 100);

const FAILURE_TITLES: Record<PurchaseFailure, string> = {
  cant_afford: "Can't afford that",
  already_owned: "Already owned",
  no_free_slot: "No free slot",
  slots_full: "No enhancement slots",
  nothing_to_enhance: "Nothing to enhance",
  cant_expand: "Can't expand",
  level_too_low: "Level too low",
  invalid: "Not available",
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
      {enhancement.levelReq !== undefined && <div>Requires level {enhancement.levelReq}</div>}
      <StatList stats={enhancement.stats} />
      {enhancement.description && <p className="item-desc">{enhancement.description}</p>}
      <div className="item-value">Value: {round(enhancement.value)} coins</div>
    </div>
  );
}

function ExpanderTip({ expander }: { expander: Expander }) {
  return (
    <div className="item-tip">
      <div className={`item-name rarity-${expander.rarity}`}>{expander.name}</div>
      <div className={`item-rarity rarity-${expander.rarity}`}>
        {getRarity(expander.rarity).label} Enhancement Expander
      </div>
      {expander.levelReq !== undefined && <div>Requires level {expander.levelReq}</div>}
      <div>
        Adds {expander.slots} enhancement slot{expander.slots === 1 ? "" : "s"} to one weapon,
        armour piece, or spell
      </div>
      {expander.description && <p className="item-desc">{expander.description}</p>}
      <div className="item-value">Value: {round(expander.value)} coins</div>
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
        showPopup({ title: FAILURE_TITLES[err.reason], message: err.message });
      } else {
        console.error(err);
        showPopup({ title: "Couldn't buy", message: "Something went wrong. Please try again." });
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
        `${enhancement.name} requires level ${enhancement.levelReq}, but you're level ${loadout.level}.`
      );
    }

    const owned = listOwned(loadout);
    if (owned.length === 0) {
      throw new PurchaseError(
        "nothing_to_enhance",
        "You don't have any gear or spells to enhance yet. Buy an item base first."
      );
    }
    if (loadout.coins < price) {
      throw new PurchaseError(
        "cant_afford",
        `${enhancement.name} costs ${price} coins, but you only have ${loadout.coins}.`
      );
    }
    const isFull = (o: Owned) => o.applied.length >= getMaxEnhancements(o.item, o.extra);
    if (owned.every(isFull)) {
      throw new PurchaseError(
        "slots_full",
        "All of your gear and spells already have the maximum number of enhancements."
      );
    }

    const slot = await chooseOwned(owned, {
      title: `Apply ${enhancement.name}`,
      message: `Pick the gear or spell to enhance. It costs ${price} coins.`,
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
        `${expander.name} requires level ${expander.levelReq}, but you're level ${loadout.level}.`
      );
    }

    const owned = listOwned(loadout);
    if (owned.length === 0) {
      throw new PurchaseError(
        "nothing_to_enhance",
        "You don't have any gear or spells to expand yet. Buy an item base first."
      );
    }
    if (!owned.some((o) => canExpandSlots(o.item))) {
      throw new PurchaseError(
        "cant_expand",
        "None of your gear or spells can have more enhancement slots."
      );
    }
    if (loadout.coins < price) {
      throw new PurchaseError(
        "cant_afford",
        `${expander.name} costs ${price} coins, but you only have ${loadout.coins}.`
      );
    }

    const slot = await chooseOwned(owned, {
      title: `Apply ${expander.name}`,
      message:
        `Pick the gear or spell to expand. It gains ${expander.slots} enhancement ` +
        `slot${expander.slots === 1 ? "" : "s"} and costs ${price} coins.`,
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

  return (
    <div>
      <div className="menu-head">
        <button onClick={onBack}>← Back</button>
        <h2>{shop.title}</h2>
      </div>

      <div className="shop-info">
        <div className="box">
          {coinIcon} Coins: <strong>{round(coins)}</strong>
        </div>
        {rotating && (
          <div className="box">
            ⏳ New stock in: <strong>{formatCountdown(season.msRemaining)}</strong>
          </div>
        )}
      </div>

      <div className="table-scroll">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Purchase</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <Tooltip content={row.tooltip}>
                  <th scope="row">
                    <span className={`rarity-${row.rarity}`}>{row.name}</span>
                    <span className="row-tag">{row.tag}</span>
                    {row.levelReq !== undefined && (
                      <span
                        className={`row-level${level < row.levelReq ? " row-level-locked" : ""}`}
                      >
                        Requires level {row.levelReq}
                      </span>
                    )}
                  </th>
                </Tooltip>
                <td>
                  {round(row.price)} {coinIcon}
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
    </div>
  );
}