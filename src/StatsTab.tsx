import { useEffect, useState } from "react";
import { STATS } from "./stats";
import { subscribeToRoomPlayers, type RoomPlayer } from "./rooms";
import Tooltip from "./Tooltip";
import { getDisplayStats } from "./statCalc";

export default function StatsTab({ roomId, uid }: { roomId: string; uid: string }) {
  // undefined = still loading
  const [players, setPlayers] = useState<RoomPlayer[] | undefined>(undefined);

  useEffect(() => subscribeToRoomPlayers(roomId, setPlayers), [roomId]);

  if (!players) return <p>Loading stats...</p>;

  // You first, then everyone else alphabetically
  const sorted = [...players].sort((a, b) =>
    a.id === uid ? -1 : b.id === uid ? 1 : a.name.localeCompare(b.name)
  );

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
              {sorted.map((p) => (
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