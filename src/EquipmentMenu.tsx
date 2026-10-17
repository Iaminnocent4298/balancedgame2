import { useState } from "react";
import { salvageItem, type Enhancements, type Equipment, type ExtraSlots } from "./equipment";
import { getSalvageValue, getSlot, slotAccepts, type Item, type SlotId } from "./items";
import { ENHANCEMENTS, ITEMS } from "./catalog";
import CatalogTooltip from "./CatalogTooltip";
import { popupMessages } from "./PopupMessages";
import { usePopup } from "./usePopup";

type Props = {
  title: string;
  slots: SlotId[]; // one card per slot, in this order
  equipment: Equipment;
  enhancements: Enhancements;
  extraSlots: ExtraSlots;
  uid: string;
  onBack: () => void;
};

export default function EquipmentMenu({
  title, slots, equipment, enhancements, extraSlots, uid, onBack,
}: Props) {
  const { showPopup, confirmPopup } = usePopup();
  const [busy, setBusy] = useState(false);

  async function handleSalvage(slot: SlotId, item: Item) {
    const appliedEnhancements = (enhancements[slot] ?? [])
      .flatMap((id) => ENHANCEMENTS[id] ? [ENHANCEMENTS[id]] : []);
    const refund = getSalvageValue(item, appliedEnhancements);
    const count = enhancements[slot]?.length ?? 0;
    const extra = extraSlots[slot] ?? 0;

    const ok = await confirmPopup(popupMessages.equipment.salvageConfirmation(item, refund, count, extra));
    if (!ok) return;

    setBusy(true);
    try {
      await salvageItem(uid, slot, item.id);
    } catch (err) {
      if (!(err instanceof Error)) console.error(err);
      showPopup(popupMessages.equipment.salvageFailure(err));
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
          const appliedEnhancements = (enhancements[slot] ?? [])
            .flatMap((id) => ENHANCEMENTS[id] ? [ENHANCEMENTS[id]] : []);

          return (
            <section key={slot} className="box equip-card">
              <h3>{getSlot(slot).label}</h3>
              {!itemId ? (
                <p className="equip-empty">Empty</p>
              ) : item && slotAccepts(slot, item.type) ? (
                <>
                  <CatalogTooltip
                    entry={item}
                    enhancements={enhancements[slot] ?? []}
                    extraSlots={extraSlots[slot] ?? 0}
                  />
                  <button
                    className="salvage"
                    disabled={busy}
                    onClick={() => handleSalvage(slot, item)}
                  >
                    Salvage (+{getSalvageValue(item, appliedEnhancements)} coins)
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