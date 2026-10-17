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
    title: "Basic Items",
    entries: [
      item("basic_weapon"),
      item("basic_helmet"),
      item("basic_chestplate"),
      item("basic_leggings"),
      item("basic_boots"),
      item("basic_heal"),
      item("basic_damage"),
      item("basic_ultimate"),
      item("t1_sword"),
      item("t2_sword"),
      item("t3_sword"),
      item("t1_helmet"),
      item("t2_helmet"),
      item("t3_helmet"),
      item("t1_chestplate"),
      item("t2_chestplate"),
      item("t3_chestplate"),
      item("t1_leggings"),
      item("t2_leggings"),
      item("t3_leggings"),
      item("t1_boots"),
      item("t2_boots"),
      item("t3_boots"),
      item("t1_heal"),
      item("t2_heal"),
      item("t3_heal"),
      item("t1_damage"),
      item("t2_damage"),
      item("t3_damage"),
      item("t1_ultimate"),
      item("t2_ultimate"),
      item("t3_ultimate"),
    ],
  },
  enhancements: {
    title: "Enhancements",
    entries: [
      enhancement("strength"),
      enhancement("defence"),
      enhancement("critical"),
      enhancement("medic"),
      enhancement("mana"),
      enhancement("berserker"),
      enhancement("tank"),
      enhancement("healer"),
      enhancement("mage"),
      enhancement("balanced"),
      expander("t1_expander"),
      expander("t2_expander"),
      expander("t3_expander"),
    ],
  },
  limited: {
    title: "Limited!",
    slots: 5, // how many are on sale at once. Raise it as the pool grows
    pool: [
      item("t4_sword"),
      item("t4_helmet"),
      item("t4_chestplate"),
      item("t4_leggings"),
      item("t4_boots"),
      enhancement("glass_cannon"),
      enhancement("shielded"),
      enhancement("stubborn"),
      enhancement("ning"),
      enhancement("brittle"),
      enhancement("academic_weapon"),
      enhancement("academic_victim"),
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