import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ENHANCEMENTS } from "./enhancementCatalog";
import type { Enhancement } from "./enhancements";
import { getLoadout, subscribeToLoadout, type Loadout } from "./equipment";
import { getSeasonInfo } from "./gameClock";
import { ITEMS } from "./itemCatalog";
import {
  GEAR_SLOTS, ITEM_TYPES, SPELL_SLOTS, getItemType, getMaxEnhancements, getRarity,
  type ItemTypeId, type RarityId,
} from "./items";
import ItemTooltip from "./ItemTooltip";
import { getRotation } from "./rotation";
import { getStartMs, type Room } from "./rooms";
import {
  SHOPS, entryKey, getPrice, isRotating, type Shop, type ShopEntry, type ShopId,
} from "./shopCatalog";
import {
  PurchaseError, purchaseEnhancement, purchaseItem, type PurchaseFailure,
} from "./shop";
import { describeField } from "./stats";
import StatList from "./StatList";
import Tooltip from "./Tooltip";
import { usePopup, type Choice } from "./usePopup";

const round = (v: number) => String(Math.round(v * 100) / 100);
const pad = (n: number) => String(n).padStart(2, "0");

// 125000 -> "2:05", 4000000 -> "1:06:40"
function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

const FAILURE_TITLES: Record<PurchaseFailure, string> = {
  cant_afford: "Can't afford that",
  already_owned: "Already owned",
  slots_full: "No enhancement slots",
  nothing_to_enhance: "Nothing to enhance",
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

  // Check, ask which item to enhance, then pay. Cancelling the popup charges nothing.
  async function buyEnhancement(entry: ShopEntry, price: number) {
    assertOnSale(entry);
    const enhancement = ENHANCEMENTS[entry.id];
    const {
      equipment, enhancements, coins: current, level: currentLevel,
    } = await getLoadout(uid);

    if (enhancement.levelReq !== undefined && currentLevel < enhancement.levelReq) {
      throw new PurchaseError(
        "level_too_low",
        `${enhancement.name} requires level ${enhancement.levelReq}, but you're level ${currentLevel}.`
      );
    }

    // Every gear piece and spell the player owns, in menu order
    const owned = ITEM_TYPES.flatMap(({ id: slot }) => {
      const itemId = equipment[slot];
      const item = itemId ? ITEMS[itemId] : undefined;
      return item && item.type === slot
        ? [{ slot, item, applied: enhancements[slot] ?? [] }]
        : [];
    });

    if (owned.length === 0) {
      throw new PurchaseError(
        "nothing_to_enhance",
        "You don't have any gear or spells to enhance yet. Buy an item base first."
      );
    }
    if (current < price) {
      throw new PurchaseError(
        "cant_afford",
        `${enhancement.name} costs ${price} coins, but you only have ${current}.`
      );
    }
    if (owned.every((o) => o.applied.length >= getMaxEnhancements(o.item))) {
      throw new PurchaseError(
        "slots_full",
        "All of your gear and spells already have the maximum number of enhancements."
      );
    }

    // Each owned item becomes a card showing its full details
    const toChoice = ({ slot, item, applied }: (typeof owned)[number]): Choice<ItemTypeId> => {
      const full = applied.length >= getMaxEnhancements(item);
      return {
        value: slot,
        disabled: full,
        buttonLabel: full ? "Full" : "Apply here",
        label: <ItemTooltip item={item} enhancements={applied} />,
      };
    };

    // Row 1: weapon and armour. Row 2: spells. A row you own nothing for is skipped.
    const groups = [
      { title: "Gear", choices: owned.filter((o) => GEAR_SLOTS.includes(o.slot)).map(toChoice) },
      { title: "Spells", choices: owned.filter((o) => SPELL_SLOTS.includes(o.slot)).map(toChoice) },
    ].filter((g) => g.choices.length > 0);

    const slot = await choosePopup<ItemTypeId>({
      title: `Apply ${enhancement.name}`,
      message: `Pick the gear or spell to enhance. It costs ${price} coins.`,
      groups,
    });
    if (!slot) return; // cancelled

    assertOnSale(entry); // the stock may have rotated while the popup was open
    await purchaseEnhancement(uid, entry.id, price, slot);
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