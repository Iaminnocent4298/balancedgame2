import type { CatalogEntry } from "./items";
import CatalogTooltip from "./CatalogTooltip";

export default function EntryTooltip({ entry }: { entry: CatalogEntry }) {
  return <CatalogTooltip entry={entry} />;
}