import { useEffect, useState } from "react";
import type { Room } from "./rooms";
import { ATTACK_SLOTS, GEAR_SLOTS, SPELL_SLOTS, type ItemTypeId } from "./items";
import { ITEMS } from "./itemCatalog";
import { subscribeToLoadout, type Loadout } from "./equipment";
import { AttackError, performAttack, type AttackFailure } from "./attack";
import EquipmentMenu from "./EquipmentMenu";
import ItemTooltip from "./ItemTooltip";
import PointsMenu from "./PointsMenu";
import ShopMenu from "./ShopMenu";
import { SHOPS, type ShopId } from "./shopCatalog";
import { usePopup } from "./usePopup";

type MenuId = "gear" | "spells";
type View = "main" | "points" | MenuId | ShopId;

const isShop = (v: View): v is ShopId => v in SHOPS;

const ATTACK_FAILURE_TITLES: Record<AttackFailure, string> = {
  no_item: "Nothing to attack with",
  target_gone: "Target not found",
  target_down: "Target is down",
  attacker_dead: "You're dead",
  not_started: "Game not started",
  invalid: "Can't attack",
};

// Each menu: its title and which slots (item types) get a card, left to right
const MENUS: Record<MenuId, { title: string; slots: ItemTypeId[] }> = {
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
      { label: "Misc" },
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
  const [attacking, setAttacking] = useState(false);

  useEffect(() => subscribeToLoadout(uid, setLoadout), [uid]);

  async function handleAttack(targetId: string, targetName: string) {
    if (!loadout) return;

    // 0) What the player can attack with: equipped weapon and damage spells
    const options = ATTACK_SLOTS.flatMap((slot) => {
      const itemId = loadout.equipment[slot];
      const item = itemId ? ITEMS[itemId] : undefined;
      return item && item.type === slot
        ? [{ slot, item, applied: loadout.enhancements[slot] ?? [] }]
        : [];
    });

    if (options.length === 0) {
      showPopup({
        title: "Nothing to attack with",
        message: "Equip a weapon or a damage spell first. You can buy item bases in the shop.",
      });
      return;
    }

    const chosen = await choosePopup<ItemTypeId>({
      title: `Attack ${targetId === uid ? "yourself" : targetName}`,
      message: "Pick what to attack with.",
      groups: [
        {
          choices: options.map(({ slot, item, applied }) => ({
            value: slot,
            buttonLabel: "Attack",
            label: <ItemTooltip item={item} enhancements={applied} />,
          })),
        },
      ],
    });
    if (!chosen) return; // cancelled

    setAttacking(true);
    try {
      const r = await performAttack(uid, targetId, chosen);

      if (r.levelsGained > 0) {
        const n = r.levelsGained;
        showPopup({
          title: "Level up!",
          message:
            `You levelled up ${n} ${n === 1 ? "time" : "times"} and gained ` +
            `${r.apGained} ability ${r.apGained === 1 ? "point" : "points"}.`,
        });
      }
    } catch (err) {
      if (err instanceof AttackError) {
        showPopup({ title: ATTACK_FAILURE_TITLES[err.reason], message: err.message });
      } else {
        console.error(err);
        showPopup({ title: "Attack failed", message: "Something went wrong. Please try again." });
      }
    } finally {
      setAttacking(false);
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
                disabled={attacking || !loadout || down}
                onClick={() => handleAttack(id, name)}
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