import { useEffect, useState } from "react";
import { STATS, isDead, withDefaults } from "./stats";
import { getStartMs, subscribeToRoomPlayers, type Room, type RoomPlayer } from "./rooms";
import { computeRegen, getRegenTick } from "./regen";
import { getDisplayStats } from "./statCalc";
import Tooltip from "./Tooltip";

export default function StatsTab({ room, uid }: { room: Room; uid: string }) {
  // undefined = still loading
  const [players, setPlayers] = useState<RoomPlayer[] | undefined>(undefined);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => subscribeToRoomPlayers(room.id, setPlayers), [room.id]);

  // Local only: lets the table pick up each regen tick as it happens
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!players) return <p>Loading stats...</p>;

  // You first, then everyone else alphabetically
  const sorted = [...players].sort((a, b) =>
    a.id === uid ? -1 : b.id === uid ? 1 : a.name.localeCompare(b.name)
  );

  // Show each player's health and mana with any regen that's due already applied
  const startMs = getStartMs(room);
  const tick = startMs === null ? 0 : getRegenTick(room.mode, startMs, now);
  const shown = sorted.map((p) => {
    const regen = computeRegen(p, tick);
    return regen
      ? { ...p, stats: { ...withDefaults(p.stats), health: regen.health, mana: regen.mana } }
      : p;
  });

  return (
    <div className="table-scroll">
      <table className="stats-table">
        <thead>
          <tr>
            <th>Stat</th>
            {sorted.map((p) => (
              <th key={p.id}>
                {p.name}
                {p.id === uid && " (you)"}
                {isDead(p.stats) && " (dead)"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STATS.map((def) => (
            <tr key={def.id} className={`stat-${def.id}`}>
              <Tooltip content={def.description}>
                <th scope="row">
                  {def.icon} {def.label}
                </th>
              </Tooltip>
              {shown.map((p) => (
                <td key={p.id}>
                  {def.display(getDisplayStats(p.stats, p.points, p.equipment, p.enhancements))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}