import { lazy, Suspense, useState } from "react";
import { useRoomData } from "./useRoomData";
import { youFirst, type Room } from "./rooms";
import {
  ACTION_KINDS, GEAR_SLOTS, getAttackMode, SLOTS, SPELL_SLOTS,
  type AttackMode, type SlotId,
} from "./items";
import { getEquippedItem } from "./catalog";
import { ActionError, performAction, performMultiAction } from "./action";
import { popupMessages } from "./PopupMessages";
import Countdown from "./Countdown";
import CatalogTooltip from "./CatalogTooltip";
import { SHOPS, type ShopId } from "./shops";
import { usePopup, type Choice } from "./usePopup";

const EquipmentMenu = lazy(() => import("./EquipmentMenu"));
const PointsMenu = lazy(() => import("./PointsMenu"));
const ShopMenu = lazy(() => import("./ShopMenu"));

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
  const { showPopup, choosePopup, choosePopupMany } = usePopup();
  const [view, setView] = useState<View>("main");
  const [busy, setBusy] = useState(false);
  const { loadout } = useRoomData(); // undefined while loading

  async function handleAction(attackMode: AttackMode) {
    if (!loadout) return;
    setBusy(true);
    try {
      const options = SLOTS.flatMap(({ id: slot }) => {
        const item = getEquippedItem(loadout.equipment, slot);
        const kind = item ? ACTION_KINDS[item.type] : undefined;
        if (!item || !kind || getAttackMode(item.attackMode) !== attackMode) return [];
        return [{
          slot,
          item,
          kind,
          applied: loadout.enhancements[slot] ?? [],
          extra: loadout.extraSlots[slot] ?? 0,
          readyAt: loadout.cooldowns[slot] ?? 0,
        }];
      });

      if (options.length === 0) {
        showPopup(loadout.equipment.weapon || Object.values(loadout.equipment).some(Boolean)
          ? popupMessages.action.noItemsForAttackMode()
          : popupMessages.action.noItemEquipped);
        return;
      }

      const toChoice = ({
        slot, item, applied, extra, readyAt,
      }: (typeof options)[number]): Choice<SlotId> => ({
        value: slot,
        buttonLabel: "Choose",
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
        title: `Choose a ${attackMode === "single" ? "Single" : "Multi"} Attack`,
        message: "Select a weapon or spell:",
        groups,
      });
      if (chosen === null) return;
      if (!SLOTS.some((s) => s.id === chosen)) {
        console.warn("The popup returned an unexpected value:", chosen);
        return;
      }

      const targetChoices = players.map(({ id, name }) => ({
        value: id,
        label: <>{name}{id === uid && " (you)"}</>,
        disabled: deadIds.has(id),
      }));
      const targetOptions = {
        title: attackMode === "single" ? "Choose a player to attack" : "Choose players to attack",
        message: attackMode === "single"
          ? "Select one player:"
          : "Select one or more players:",
        groups: [{ choices: targetChoices }],
      };
      const targets = attackMode === "single"
        ? await choosePopup<string>(targetOptions).then((target) => target ? [target] : null)
        : await choosePopupMany<string>(targetOptions);
      if (targets === null) return;

      const results = attackMode === "multi"
        ? await performMultiAction(uid, targets, chosen)
        : [await performAction(uid, targets[0], chosen)];
      const levelsGained = results.reduce(
        (sum, result) => sum + (result.kind === "attack" ? result.levelsGained : 0),
        0
      );
      const apGained = results.reduce(
        (sum, result) => sum + (result.kind === "attack" ? result.apGained : 0),
        0
      );
      if (levelsGained > 0) showPopup(popupMessages.action.levelUp(levelsGained, apGained));
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

  if (view === "points") {
    return (
      <Suspense fallback={<p>Loading points...</p>}>
        <PointsMenu uid={uid} onBack={() => setView("main")} />
      </Suspense>
    );
  }

  if (isShop(view)) {
    return (
      <Suspense fallback={<p>Loading shop...</p>}>
        <ShopMenu shopId={view} room={room} uid={uid} onBack={() => setView("main")} />
      </Suspense>
    );
  }

  if (view !== "main") {
    if (!loadout) return <p>Loading...</p>;
    const menu = MENUS[view];
    return (
      <Suspense fallback={<p>Loading inventory...</p>}>
        <EquipmentMenu
          title={menu.title}
          slots={menu.slots}
          equipment={loadout.equipment}
          enhancements={loadout.enhancements}
          extraSlots={loadout.extraSlots}
          uid={uid}
          onBack={() => setView("main")}
        />
      </Suspense>
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
          <button disabled={busy || !loadout} onClick={() => handleAction("single")}>
            Single Attack
          </button>
          <button disabled={busy || !loadout} onClick={() => handleAction("multi")}>
            Multi Attack
          </button>
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