import { useEffect, useState } from "react";
import type { Room } from "./rooms";
import type { ItemTypeId } from "./items";
import { subscribeToLoadout, type Loadout } from "./equipment";
import EquipmentMenu from "./EquipmentMenu";
import PointsMenu from "./PointsMenu";
import ShopMenu from "./ShopMenu";
import { SHOPS, type ShopId } from "./shopCatalog";

type MenuId = "gear" | "spells";
type View = "main" | "points" | MenuId | ShopId;

const isShop = (v: View): v is ShopId => v in SHOPS;

// Each menu: its title and which slots (item types) get a card, left to right
const MENUS: Record<MenuId, { title: string; slots: ItemTypeId[] }> = {
  gear: { title: "Gear", slots: ["weapon", "helmet", "chestplate", "leggings", "boots"] },
  spells: {
    title: "Spells",
    slots: ["healing_spell", "damage_spell", "aoe_spell", "ultimate_spell"],
  },
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
      { label: "Limited!" },
    ],
  },
  { title: "Points", buttons: [{ label: "Modify", view: "points" }] },
];

export default function ActionTab({ room, uid }: { room: Room; uid: string }) {
  const [view, setView] = useState<View>("main");
  // undefined = still loading
  const [loadout, setLoadout] = useState<Loadout | undefined>(undefined);

  useEffect(() => subscribeToLoadout(uid, setLoadout), [uid]);

  if (view === "points") return <PointsMenu uid={uid} onBack={() => setView("main")} />;

  if (isShop(view)) {
    return <ShopMenu shopId={view} uid={uid} onBack={() => setView("main")} />;
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
          {players.map(([id, name]) => (
            <button key={id}>
              {name}
              {id === uid && " (you)"}
            </button>
          ))}
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