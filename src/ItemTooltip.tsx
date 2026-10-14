import { getRarity, type Item } from "./items";
import { describeField } from "./stats";

const round = (v: number) => String(Math.round(v * 100) / 100);

export default function ItemTooltip({ item }: { item: Item }) {
  const stats = Object.entries(item.stats ?? {}).filter(([, v]) => v !== 0);

  return (
    <div className="item-tip">
      <div className={`item-name rarity-${item.rarity}`}>{item.name}</div>
      <div className={`item-rarity rarity-${item.rarity}`}>{getRarity(item.rarity).label}</div>

      {item.levelReq !== undefined && <div>Requires level {item.levelReq}</div>}

      {stats.length > 0 && (
        <ul className="item-stats">
          {stats.map(([key, amount]) => {
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
      )}

      {item.description && <p className="item-desc">{item.description}</p>}

      <div className="item-value">Value: {round(item.value)} coins</div>
    </div>
  );
}