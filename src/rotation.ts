import { entryKey, type ShopEntry } from "./shopCatalog";

// Turns text into a stream of random-looking but repeatable numbers (0 up to 1).
// The same text always gives the same stream.
function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  let a = (h ^ (h >>> 16)) >>> 0;

  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(list: T[], random: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// The items on sale during a given season. The same room code and season always
// give the same result, so nothing needs to be stored.
// It replays every season from the start so each rotation can avoid repeating
// the one before it. That's a few hundred tiny steps at most, so it's instant.
export function getRotation(
  roomId: string,
  seasonIndex: number,
  pool: ShopEntry[],
  slots: number
): ShopEntry[] {
  let previous = new Set<string>();
  let current: ShopEntry[] = [];

  for (let season = 0; season <= seasonIndex; season++) {
    const random = seededRandom(`${roomId}:${season}`);
    const fresh = pool.filter((e) => !previous.has(entryKey(e)));
    const repeats = pool.filter((e) => previous.has(entryKey(e)));
    // New items first. Repeats only fill in if the pool is too small to avoid them
    current = [...shuffled(fresh, random), ...shuffled(repeats, random)].slice(0, slots);
    previous = new Set(current.map(entryKey));
  }

  // List them in the pool's order so the table doesn't look scrambled
  return current.sort((a, b) => pool.indexOf(a) - pool.indexOf(b));
}