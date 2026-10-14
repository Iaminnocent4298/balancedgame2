import type { Room } from "./rooms";

// Static columns: add or rename buttons here
const COLUMNS = [
  { title: "Inventory", buttons: ["Weapons", "Armour", "Spells", "Misc"] },
  { title: "Shop", buttons: ["Item bases", "Enhancements", "Limited!"] },
  { title: "Points", buttons: ["Modify"] },
];

export default function ActionTab({ room, uid }: { room: Room; uid: string }) {
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
            </button>
          ))}
        </div>
      </section>

      {COLUMNS.map((col) => (
        <section key={col.title} className="box action-col">
          <h2>{col.title}</h2>
          <div className="action-buttons">
            {col.buttons.map((label) => (
              <button key={label}>{label}</button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}