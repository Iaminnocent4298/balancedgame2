import { useEffect, useState } from "react";
import type { Room } from "./rooms";
import { ACTION_KINDS, GEAR_SLOTS, SLOTS, SPELL_SLOTS, slotAccepts, type SlotId } from "./items";
import { ITEMS } from "./itemCatalog";
import { subscribeToLoadout, type Loadout } from "./equipment";
import { ActionError, performAction, type ActionFailure } from "./action";
import Countdown from "./Countdown";
import EquipmentMenu from "./EquipmentMenu";
import ItemTooltip from "./ItemTooltip";
import PointsMenu from "./PointsMenu";
import ShopMenu from "./ShopMenu";
import { SHOPS, type ShopId } from "./shopCatalog";
import { usePopup, type Choice } from "./usePopup";

type MenuId = "gear" | "spells";
type View = "main" | "points" | MenuId | ShopId;

const isShop = (v: View): v is ShopId => v in SHOPS;

const ACTION_FAILURE_TITLES: Record<ActionFailure, string> = {
  no_item: "Nothing to use",
  target_gone: "Target not found",
  target_down: "Target is down",
  actor_dead: "You're dead",
  not_started: "Game not started",
  on_cooldown: "On cooldown",
  not_enough_mana: "Not enough mana",
  nothing_to_heal: "Nothing to heal",
  invalid: "Can't do that",
};

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
    buttons: [
      { label: "Item bases", view: "itemBases" },
      { label: "Enhancements", view: "enhancements" },
      { label: "Limited!", view: "limited" },
    ],
  },
  { title: "Points", buttons: [{ label: "Modify", view: "points" }] },
];

export default function ActionTab({
  room, uid, deadIds,
}: { room: Room; uid: string; deadIds: Set<string> }) {
  const { showPopup, choosePopup } = usePopup();
  const [view, setView] = useState<View>("main");
  // undefined = still loading
  const [loadout, setLoadout] = useState<Loadout | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeToLoadout(uid, setLoadout), [uid]);

  async function handleAction(targetId: string, targetName: string) {
    if (!loadout) return;

    // 0) What the player can use: the equipped weapon and any attack or healing spells
    const now = Date.now();
    const options = SLOTS.flatMap(({ id: slot }) => {
      const itemId = loadout.equipment[slot];
      const item = itemId ? ITEMS[itemId] : undefined;
      const kind = item ? ACTION_KINDS[item.type] : undefined;
      if (!item || !kind || !slotAccepts(slot, item.type)) return [];
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
      showPopup({
        title: "What are you gonna attack with-",
        message: "Purchase a weapon or a spell first silly :3",
      });
      return;
    }

    const toChoice = ({
      slot, item, kind, applied, extra, readyAt,
    }: (typeof options)[number]): Choice<SlotId> => {
      const cooling = readyAt > now;
      return {
        value: slot,
        disabled: cooling,
        buttonLabel: cooling ? "On cooldown" : kind === "heal" ? "Heal" : "Attack",
        tooltip: cooling ? (
          <>
            On cooldown: <Countdown until={readyAt} /> remaining
          </>
        ) : undefined,
        label: <ItemTooltip item={item} enhancements={applied} extraSlots={extra} />,
      };
    };

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
      title: `Use on ${targetId === uid ? "yourself" : targetName}`,
      message: "Pick your method of attack (or heal):",
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
        const n = r.levelsGained;
        showPopup({
          title: "Level up, woahhhhhhh",
          message:
            `You levelled up ${n} ${n === 1 ? "time" : "times"} and gained ` +
            `${r.apGained} ability ${r.apGained === 1 ? "point" : "points"}.`,
        });
      }
    } catch (err) {
      if (err instanceof ActionError) {
        showPopup({ title: ACTION_FAILURE_TITLES[err.reason], message: err.message });
      } else {
        console.error(err);
        showPopup({ title: "Action failed", message: "Something went wrong. Contact @iaminnocent4298 if this error persists." });
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

  // You first, then everyone else alphabetically (same order as the stats table)
  const players = Object.entries(room.members).sort(([idA, nameA], [idB, nameB]) =>
    idA === uid ? -1 : idB === uid ? 1 : nameA.localeCompare(nameB)
  );

  return (
    <div className="action-grid">
      <section className="box action-col">
        <h2>Attack</h2>
        <div className="action-buttons">
          {players.map(([id, name]) => {
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