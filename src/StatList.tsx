import type { ItemStats } from "./items";
import { describeField } from "./stats";

const round = (v: number) => String(Math.round(v * 100) / 100);

export default function StatList({ stats }: { stats?: ItemStats }) {
  const entries = Object.entries(stats ?? {}).filter(([, v]) => v !== 0);
  if (entries.length === 0) return null;

  return (
    <ul className="item-stats">
      {entries.map(([key, amount]) => {
        const { icon, label, suffix } = describeField(key);
        return (
          <li key={key} className={amount > 0 ? "item-stat-up" : "item-stat-down"}>
            {icon} {label}: {amount > 0 ? "+" : "-"}
            {round(Math.abs(amount))}
            {suffix}
          </li>
        );
      })}
    </ul>
  );
}