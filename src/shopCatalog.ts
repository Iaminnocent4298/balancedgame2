import { ENHANCEMENTS } from "./enhancementCatalog";
import { ITEMS } from "./itemCatalog";
import { EXPANDERS } from "./expanderCatalog";

export type SaleKind = "item" | "enhancement" | "expander";

export type ShopEntry = {
  kind: SaleKind; // "item" = from itemCatalog.ts, "enhancement" = from enhancementCatalog.ts
  id: string;
  price?: number; // in coins. If left out, the catalog's value is the price
};

// Short ways to write entries
const item = (id: string, price?: number): ShopEntry => ({ kind: "item", id, price });
const enhancement = (id: string, price?: number): ShopEntry => ({
  kind: "enhancement", id, price,
});
const expander = (id: string, price?: number): ShopEntry => ({ kind: "expander", id, price });

// Always sells the same things
export type FixedShop = { title: string; entries: ShopEntry[] };
// Sells `slots` items picked from `pool`, with a new pick every season
export type RotatingShop = { title: string; slots: number; pool: ShopEntry[] };
export type Shop = FixedShop | RotatingShop;

export const isRotating = (shop: Shop): shop is RotatingShop => "pool" in shop;

// ADD NEW SHOPS HERE. The key is the shop's id.
export const SHOPS = {
  itemBases: {
    title: "Item Bases",
    entries: [
    ],
  },
  enhancements: {
    title: "Enhancements",
    entries: [
    ],
  },
  limited: {
    title: "Limited!",
    slots: 5, // how many are on sale at once. Raise it as the pool grows
    pool: [
    ],
  },
} satisfies Record<string, Shop>;

export type ShopId = keyof typeof SHOPS;

const catalogFor = (kind: SaleKind): Record<string, { value: number }> =>
  kind === "item" ? ITEMS : kind === "enhancement" ? ENHANCEMENTS : EXPANDERS;

export const getPrice = (entry: ShopEntry) =>
  entry.price ?? catalogFor(entry.kind)[entry.id].value;

// A unique key for an entry (an item and an enhancement could share an id)
export const entryKey = (entry: ShopEntry) => `${entry.kind}:${entry.id}`;

// Catch typos as soon as the app loads
for (const [shopId, shop] of Object.entries(SHOPS as Record<string, Shop>)) {
  if (isRotating(shop) && !(Number.isInteger(shop.slots) && shop.slots >= 1)) {
    throw new Error(`Shop "${shopId}" needs a whole number of slots (1 or more)`);
  }
  for (const entry of isRotating(shop) ? shop.pool : shop.entries) {
    if (!(entry.id in catalogFor(entry.kind))) {
      throw new Error(`Shop "${shopId}" sells unknown ${entry.kind} "${entry.id}"`);
    }
    if (entry.price !== undefined && !(entry.price >= 0)) {
      throw new Error(`Shop "${shopId}" has an invalid price for "${entry.id}"`);
    }
  }
}