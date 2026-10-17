// Splits a list into up to `maxTables` chunks of roughly equal size, adding
// tables only when a single table would be longer than `maxPerTable` rows.
export function splitTables<T>(list: T[], maxPerTable: number, maxTables: number): T[][] {
  if (list.length === 0) return [];
  const count = Math.min(maxTables, Math.max(1, Math.ceil(list.length / maxPerTable)));
  const size = Math.ceil(list.length / count);

  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}