import { ENHANCEMENTS } from "./enhancementCatalog";
import { getItemType, getMaxEnhancements, getRarity, type Item } from "./items";
import StatList from "./StatList";
import { describeField } from "./stats";

const round = (v: number) => String(Math.round(v * 100) / 100);

type Props = {
  item: Item;
  // Enhancement ids applied to this item. Leave out (e.g. in shops) to just show the slot count.
  enhancements?: string[];
  extraSlots?: number; // slots added by expanders
};

export default function ItemTooltip({ item, enhancements, extraSlots }: Props) {
  const max = getMaxEnhancements(item, extraSlots);
  const applied = (enhancements ?? []).flatMap((id) =>
    ENHANCEMENTS[id] ? [ENHANCEMENTS[id]] : []
  );

  return (
    <div className="item-tip">
      <div className={`item-name rarity-${item.rarity}`}>{item.name}</div>

      {item.levelReq !== undefined && <div className="stat-level">Req: ✷ {item.levelReq}</div>}
      
      <StatList stats={item.stats} />

      {item.manaCost !== undefined && (
        <div className="item-mana">
          {describeField("mana").icon} Mana cost: {item.manaCost}
        </div>
      )}

      {max > 0 &&
        (enhancements === undefined ? (
          <div>Enhancement slots: {max}</div>
        ) : (
          <div className="item-enh">
            <div className="item-enh-title">
              Enhancements ({applied.length}/{max})
            </div>
            {applied.map((e, i) => (
              <div key={i}>
                <span className={`rarity-${e.rarity}`}>{e.name}</span>
                <StatList stats={e.stats} />
              </div>
            ))}
          </div>
        ))}

      {item.description && <p className="item-desc">{item.description}</p>}

      <div className={`item-rarity rarity-${item.rarity}`}>
        {getRarity(item.rarity).label} {getItemType(item.type).label}
      </div>

      <div className="item-value stat-coins">Value: $ {round(item.value)}</div>
    </div>
  );
}