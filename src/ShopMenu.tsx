import { useEffect, useState, type ReactNode } from "react";
import { ENHANCEMENTS } from "./enhancementCatalog";
import type { Enhancement } from "./enhancements";
import { getLoadout } from "./equipment";
import { ITEMS } from "./itemCatalog";
import {
  ITEM_TYPES, getItemType, getMaxEnhancements, getRarity,
  type ItemTypeId, type RarityId,
} from "./items";
import ItemTooltip from "./ItemTooltip";
import { SHOPS, getPrice, type Shop, type ShopId } from "./shopCatalog";
import {
  PurchaseError, purchaseEnhancement, purchaseItem, subscribeToCoins,
  type PurchaseFailure,
} from "./shop";
import { describeField } from "./stats";
import StatList from "./StatList";
import Tooltip from "./Tooltip";
import { usePopup } from "./usePopup";

const round = (v: number) => String(Math.round(v * 100) / 100);

const FAILURE_TITLES: Record<PurchaseFailure, string> = {
  cant_afford: "Can't afford that",
  already_owned: "Already owned",
  slots_full: "No enhancement slots",
  nothing_to_enhance: "Nothing to enhance",
  invalid: "Not available",
};

type Row = {
  key: string;
  name: string;
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
      <StatList stats={enhancement.stats} />
      {enhancement.description && <p className="item-desc">{enhancement.description}</p>}
      <div className="item-value">Value: {round(enhancement.value)} coins</div>
    </div>
  );
}

type Props = { shopId: ShopId; uid: string; onBack: () => void };

export default function ShopMenu({ shopId, uid, onBack }: Props) {
  const shop: Shop = SHOPS[shopId];
  const { showPopup, choosePopup } = usePopup();
  // undefined = still loading
  const [coins, setCoins] = useState<number | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeToCoins(uid, setCoins), [uid]);

  if (coins === undefined) return <p>Loading...</p>;

  const coinIcon = describeField("coins").icon;

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
  async function buyEnhancement(id: string, price: number) {
    const enhancement = ENHANCEMENTS[id];
    const { equipment, enhancements, coins: current } = await getLoadout(uid);

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

    const slot = await choosePopup<ItemTypeId>({
      title: `Apply ${enhancement.name}`,
      message: `Pick the gear or spell to enhance. It costs ${price} coins.`,
      choices: owned.map(({ slot, item, applied }) => {
        const max = getMaxEnhancements(item);
        const full = applied.length >= max;
        return {
          value: slot,
          disabled: full,
          tooltip: <ItemTooltip item={item} enhancements={applied} />,
          label: (
            <>
              <span className={`choice-line choice-name rarity-${item.rarity}`}>{item.name}</span>
              <span className="choice-line choice-sub">
                {getItemType(slot).label} ·{" "}
                {full ? `Full (${applied.length}/${max})` : `Enhancements ${applied.length}/${max}`}
              </span>
              {item.description && (
                <span className="choice-line choice-desc">{item.description}</span>
              )}
            </>
          ),
        };
      }),
    });
    if (!slot) return; // cancelled

    await purchaseEnhancement(uid, id, price, slot);
  }

  const rows: Row[] = shop.entries.map((entry) => {
    const price = getPrice(shop.kind, entry);

    if (shop.kind === "item") {
      const item = ITEMS[entry.id];
      return {
        key: entry.id,
        name: item.name,
        rarity: item.rarity,
        tooltip: <ItemTooltip item={item} />,
        price,
        buy: () => purchaseItem(uid, entry.id, price),
      };
    }

    const enhancement = ENHANCEMENTS[entry.id];
    return {
      key: entry.id,
      name: enhancement.name,
      rarity: enhancement.rarity,
      tooltip: <EnhancementTip enhancement={enhancement} />,
      price,
      buy: () => buyEnhancement(entry.id, price),
    };
  });

  return (
    <div>
      <div className="menu-head">
        <button onClick={onBack}>← Back</button>
        <h2>{shop.title}</h2>
      </div>

      <div className="box balance">
        {coinIcon} Coins: <strong>{round(coins)}</strong>
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