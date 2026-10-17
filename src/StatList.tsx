import type { ItemStats } from "./items";
import { describeField } from "./stats";
import { formatNumber as round } from "./format";

export default function StatList({ stats }: { stats?: ItemStats }) {
  const entries = Object.entries(stats ?? {}).filter(([, v]) => v !== 0);
  if (entries.length === 0) return null;

  return (
    <ul className="item-stats">
      {entries.map(([key, amount]) => {
        const { icon, label, suffix } = describeField(key);
        return (
          <li key={key}>
            <span className={`stat-${key}`}>{icon} {(key === "healthRegenPercent" || key === "manaRegenPercent") ? label + suffix : label}</span>: 
            <span className={amount > 0 ? "item-stat-up" : "item-stat-down"}> {amount > 0 ? "+" : "-"}
            {round(Math.abs(amount))}
            {suffix}
            </span>
          </li>
        );
      })}
    </ul>
  );
}