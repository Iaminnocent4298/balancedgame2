import { ENHANCEMENTS } from "./enhancementCatalog";
import { ITEMS } from "./itemCatalog";

// "item" shops sell items from itemCatalog.ts, "enhancement" shops sell from enhancementCatalog.ts
export type ShopKind = "item" | "enhancement";

export type ShopEntry = {
  id: string; // an item id or enhancement id, depending on the shop's kind
  price?: number; // in coins. If left out, the catalog's value is the price
};

export type Shop = { title: string; kind: ShopKind; entries: ShopEntry[] };

// ADD NEW SHOPS HERE. The key is the shop's id.
export const SHOPS = {
  itemBases: {
    title: "Item Bases",
    kind: "item",
    entries: [
      { id: "weapon_base" },
      { id: "helmet_base" },
      { id: "chestplate_base" },
      { id: "leggings_base" },
      { id: "boots_base" },
      { id: "healing_spell_base" },
      { id: "damage_spell_base" },
      { id: "aoe_spell_base" },
      { id: "ultimate_spell_base" },
    ],
  },
  enhancements: {
    title: "Enhancements",
    kind: "enhancement",
    entries: [
      { id: "sharpness" },
      { id: "fortify" },
      { id: "vitality" },
      { id: "arcane_focus" },
      { id: "keen_edge" },
      { id: "empower" },
    ],
  },
} satisfies Record<string, Shop>;

export type ShopId = keyof typeof SHOPS;

export const getPrice = (kind: ShopKind, entry: ShopEntry) =>
  entry.price ?? (kind === "item" ? ITEMS : ENHANCEMENTS)[entry.id].value;

// Catch typos as soon as the app loads
for (const [shopId, shop] of Object.entries(SHOPS as Record<string, Shop>)) {
  const catalog = shop.kind === "item" ? ITEMS : ENHANCEMENTS;
  for (const entry of shop.entries) {
    if (!(entry.id in catalog)) {
      throw new Error(`Shop "${shopId}" sells unknown ${shop.kind} "${entry.id}"`);
    }
    if (entry.price !== undefined && !(entry.price >= 0)) {
      throw new Error(`Shop "${shopId}" has an invalid price for "${entry.id}"`);
    }
  }
}