// Shops are defined here. WHAT a shop sells is decided by the `shop` field on
// each entry in catalog.ts, so adding a shop means one line here.
export type ShopDef = {
  title: string;
  rotating?: { slots: number }; // set for a rotating shop: how many entries are on sale at once
};

const defs = {
  basicItems: { title: "Basic Items" },
  enhancements: { title: "Enhancements" },
  limited: { title: "Limited!", rotating: { slots: 5 } },
} satisfies Record<string, ShopDef>;

export type ShopId = keyof typeof defs;
export const SHOPS: Record<ShopId, ShopDef> = defs;

for (const [id, shop] of Object.entries(SHOPS)) {
  if (shop.rotating && !(Number.isInteger(shop.rotating.slots) && shop.rotating.slots >= 1)) {
    throw new Error(`Shop "${id}" needs a whole number of rotating slots (1 or more)`);
  }
}