import { ENHANCEMENTS } from "./catalog";
import { formatNumber } from "./format";
import {
  getItemType, getMaxEnhancements, getRarity, kindLabel, type CatalogEntry,
} from "./items";
import { describeField } from "./stats";
import StatList from "./StatList";

type Props = {
  entry: CatalogEntry;
  // Enhancement ids applied to this item. Leave out to show only its slot count.
  enhancements?: string[];
  extraSlots?: number;
};

export default function CatalogTooltip({ entry, enhancements, extraSlots }: Props) {
  const item = entry.kind === "item" ? entry : undefined;
  const maxEnhancements = item ? getMaxEnhancements(item, extraSlots) : 0;
  const applied = (enhancements ?? []).flatMap((id) =>
    ENHANCEMENTS[id] ? [ENHANCEMENTS[id]] : []
  );
  const totalValue = item
    ? item.value + applied.reduce((sum, enhancement) => sum + enhancement.value, 0)
    : entry.value;

  return (
    <div className="item-tip">
      <div className={`item-name rarity-${entry.rarity}`}>{entry.name}</div>

      {entry.levelReq !== undefined && (
        <div className="stat-level">Req: ✷ {entry.levelReq}</div>
      )}

      {entry.kind !== "expander" && <StatList stats={entry.stats} />}

      {item?.manaCost !== undefined && (
        <div className="item-mana">
          {describeField("mana").icon} Mana cost: {item.manaCost}
        </div>
      )}

      {item && maxEnhancements > 0 &&
        (enhancements === undefined ? (
          <div>Enhancement slots: {maxEnhancements}</div>
        ) : (
          <div className="item-enh">
            <div className="item-enh-title">
              Enhancements ({applied.length}/{maxEnhancements})
            </div>
            {applied.map((enhancement, index) => (
              <div key={index}>
                <span className={`rarity-${enhancement.rarity}`}>{enhancement.name}</span>
                <StatList stats={enhancement.stats} />
              </div>
            ))}
          </div>
        ))}

      {entry.description && <p className="item-desc">{entry.description}</p>}

      <div className={`item-rarity rarity-${entry.rarity}`}>
        {getRarity(entry.rarity).label}{" "}
        {item ? getItemType(item.type).label : kindLabel(entry)}
      </div>

      <div className={`item-value${item ? " stat-coins" : ""}`}>
        Value: {item ? "$ " : ""}{formatNumber(totalValue)}{item ? "" : " coins"}
      </div>
    </div>
  );
}
