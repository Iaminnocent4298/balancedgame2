import { useState } from "react";
import { useRoomData } from "./useRoomData";
import { youFirst, type Room } from "./rooms";
import { ACTION_KINDS, GEAR_SLOTS, SLOTS, SPELL_SLOTS, type SlotId } from "./items";
import { getEquippedItem } from "./catalog";
import { ActionError, performAction } from "./action";
import { popupMessages } from "./PopupMessages";
import Countdown from "./Countdown";
import CatalogTooltip from "./CatalogTooltip";
import EquipmentMenu from "./EquipmentMenu";
import PointsMenu from "./PointsMenu";
import ShopMenu from "./ShopMenu";
import { SHOPS, type ShopId } from "./shops";
import { usePopup, type Choice } from "./usePopup";

type MenuId = "gear" | "spells";
type View = "main" | "points" | MenuId | ShopId;

const isShop = (v: View): v is ShopId => v in SHOPS;

// Each menu: its title and which slots get a card, left to right
const MENUS: Record<MenuId, { title: string; slots: SlotId[] }> = {
  gear: { title: "Gear", slots: GEAR_SLOTS },
  spells: { title: "Spells", slots: SPELL_SLOTS },
};

// Static columns. A button with a "view" opens that menu; the rest do nothing yet.
const COLUMNS: { title: string; buttons: { label: string; view?: View }[] }[] = [
  {
    title: "Inventory",
    buttons: [
      { label: "Gear", view: "gear" },
      { label: "Spells", view: "spells" },
      { label: "COMING SOON" },
    ],
  },
  {
    title: "Shop",
    buttons: (Object.keys(SHOPS) as ShopId[]).map((id) => ({
      label: SHOPS[id].title,
      view: id,
    })),
  },
  { title: "Points", buttons: [{ label: "Modify", view: "points" }] },
];

export default function ActionTab({
  room, uid, deadIds,
}: { room: Room; uid: string; deadIds: Set<string> }) {
  const { showPopup, choosePopup } = usePopup();
  const [view, setView] = useState<View>("main");
  const [busy, setBusy] = useState(false);
  const { loadout } = useRoomData(); // undefined while loading

  async function handleAction(targetId: string, targetName: string) {
    if (!loadout) return;

    const options = SLOTS.flatMap(({ id: slot }) => {
      const item = getEquippedItem(loadout.equipment, slot);
      const kind = item ? ACTION_KINDS[item.type] : undefined;
      if (!item || !kind) return [];
      return [
        {
          slot,
          item,
          kind,
          applied: loadout.enhancements[slot] ?? [],
          extra: loadout.extraSlots[slot] ?? 0,
          readyAt: loadout.cooldowns[slot] ?? 0,
        },
      ];
    });

    if (options.length === 0) {
      showPopup(popupMessages.action.noItemEquipped);
      return;
    }

    const toChoice = ({
      slot, item, kind, applied, extra, readyAt,
    }: (typeof options)[number]): Choice<SlotId> => ({
      value: slot,
      buttonLabel: kind === "heal" ? "Heal" : "Attack",
      // The popup unlocks the card by itself when this time passes
      lockedUntil: readyAt > 0 ? readyAt : undefined,
      lockedLabel: "On cooldown",
      lockedTooltip: (
        <>
          On cooldown: <Countdown until={readyAt} /> remaining
        </>
      ),
      label: <CatalogTooltip entry={item} enhancements={applied} extraSlots={extra} />,
    });

    const groups = [
      {
        title: "Weapon",
        choices: options.filter((o) => !SPELL_SLOTS.includes(o.slot)).map(toChoice),
      },
      {
        title: "Spells",
        choices: options.filter((o) => SPELL_SLOTS.includes(o.slot)).map(toChoice),
      },
    ].filter((g) => g.choices.length > 0);

    const chosen = await choosePopup<SlotId>({
      ...popupMessages.action.chooseItem(targetId === uid ? "yourself" : targetName),
      groups,
    });

    // Cancel, Escape, and clicking outside all give back null: do nothing
    if (chosen === null) return;
    if (!SLOTS.some((s) => s.id === chosen)) {
      console.warn("The popup returned an unexpected value:", chosen);
      return;
    }

    setBusy(true);
    try {
      const r = await performAction(uid, targetId, chosen);

      if (r.kind === "attack" && r.levelsGained > 0) {
        showPopup(popupMessages.action.levelUp(r.levelsGained, r.apGained));
      }
    } catch (err) {
      if (err instanceof ActionError) {
        showPopup(popupMessages.action.failure(err.reason, err.message));
      } else {
        console.error(err);
        showPopup(popupMessages.action.unexpectedFailure());
      }
    } finally {
      setBusy(false);
    }
  }

  if (view === "points") return <PointsMenu uid={uid} onBack={() => setView("main")} />;

  if (isShop(view)) {
    return <ShopMenu shopId={view} room={room} uid={uid} onBack={() => setView("main")} />;
  }

  if (view !== "main") {
    if (!loadout) return <p>Loading...</p>;
    const menu = MENUS[view];
    return (
      <EquipmentMenu
        title={menu.title}
        slots={menu.slots}
        equipment={loadout.equipment}
        enhancements={loadout.enhancements}
        extraSlots={loadout.extraSlots}
        uid={uid}
        onBack={() => setView("main")}
      />
    );
  }

  const players = youFirst(
    Object.entries(room.members).map(([id, name]) => ({ id, name })), 
    uid
  );

  return (
    <div className="action-grid">
      <section className="box action-col">
        <h2>Attack</h2>
        <div className="action-buttons">
          {players.map(({ id, name }) => {
            const down = deadIds.has(id);
            return (
              <button
                key={id}
                disabled={busy || !loadout || down}
                onClick={() => handleAction(id, name)}
              >
                {name}
                {id === uid && " (you)"}
                {down && " (dead)"}
              </button>
            );
          })}
        </div>
      </section>

      {COLUMNS.map((col) => (
        <section key={col.title} className="box action-col">
          <h2>{col.title}</h2>
          <div className="action-buttons">
            {col.buttons.map(({ label, view: target }) => (
              <button key={label} onClick={target ? () => setView(target) : undefined}>
                {label}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}