import { useState } from "react";
import { salvageItem, type Enhancements, type Equipment } from "./equipment";
import { getItemType, getSalvageValue, type Item, type ItemTypeId } from "./items";
import { ITEMS } from "./itemCatalog";
import ItemTooltip from "./ItemTooltip";
import { usePopup } from "./usePopup";

type Props = {
  title: string;
  slots: ItemTypeId[]; // one card per slot, in this order
  equipment: Equipment;
  enhancements: Enhancements;
  uid: string;
  onBack: () => void;
};

export default function EquipmentMenu({ title, slots, equipment, enhancements, uid, onBack }: Props) {
  const { showPopup, confirmPopup } = usePopup();
  const [busy, setBusy] = useState(false);

  async function handleSalvage(slot: ItemTypeId, item: Item) {
    const refund = getSalvageValue(item);
    const count = enhancements[slot]?.length ?? 0;

    const ok = await confirmPopup({
      title: "Salvage item?",
      message: (
        <>
          Salvage <strong className={`rarity-${item.rarity}`}>{item.name}</strong> for{" "}
          <strong>{refund} coins</strong>?{" "}
          {count > 0 && (
            <>
              Its {count} enhancement{count === 1 ? "" : "s"} will be lost (not refunded).{" "}
            </>
          )}
          Its stat bonuses will be removed. This can't be undone.
        </>
      ),
      confirmLabel: "Salvage",
      cancelLabel: "Keep it",
    });
    if (!ok) return;

    setBusy(true);
    try {
      await salvageItem(uid, slot, item.id);
    } catch (err) {
      showPopup({
        title: "Couldn't salvage",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="menu-head">
        <button onClick={onBack}>← Back</button>
        <h2>{title}</h2>
      </div>

      <div className="equip-row">
        {slots.map((slot) => {
          const itemId = equipment[slot];
          const item: Item | undefined = itemId ? ITEMS[itemId] : undefined;

          return (
            <section key={slot} className="box equip-card">
              <h3>{getItemType(slot).label}</h3>
              {!itemId ? (
                <p className="equip-empty">Empty</p>
              ) : item?.type === slot ? (
                <>
                  <ItemTooltip item={item} enhancements={enhancements[slot] ?? []} />
                  <button
                    className="salvage"
                    disabled={busy}
                    onClick={() => handleSalvage(slot, item)}
                  >
                    Salvage (+{getSalvageValue(item)} coins)
                  </button>
                </>
              ) : (
                <p className="equip-empty">Unknown item</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}