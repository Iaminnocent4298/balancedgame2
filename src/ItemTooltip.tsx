import type { Item } from "./items";
import CatalogTooltip from "./CatalogTooltip";

type Props = {
  item: Item;
  // Enhancement ids applied to this item. Leave out (e.g. in shops) to just show the slot count.
  enhancements?: string[];
  extraSlots?: number; // slots added by expanders
};

export default function ItemTooltip({ item, enhancements, extraSlots }: Props) {
  return <CatalogTooltip entry={item} enhancements={enhancements} extraSlots={extraSlots} />;
}