import { STATS, isDead } from "./stats";
import { getDisplayStats } from "./statCalc";
import Tooltip from "./Tooltip";
import { useRoomData } from "./useRoomData";
import { youFirst } from "./rooms";

export default function StatsTab({ uid }: { uid: string }) {
  const { players } = useRoomData();

  if (!players) return <p>Loading stats...</p>;

  const sorted = youFirst(players, uid);

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