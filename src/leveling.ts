// XP needed to go from `level` to `level + 1`. PLACEHOLDER curve: change it freely.
// Keep xpToNextLevel(1) equal to the nextLevelXp default in stats.ts (100).
export const xpToNextLevel = (level: number, prev : number) => prev + Math.floor(level/5) * 50;

export function applyXp(level: number, levelXp: number, nextLevelXp: number, gained: number) {
  let lvl = level;
  let xp = levelXp + gained;
  let need = Math.max(1, nextLevelXp);
  let levelsGained = 0;
  let apGained = 0;

  // One hit can be worth several levels
  while (xp >= need && levelsGained < 1000) {
    xp -= need;
    lvl += 1;
    levelsGained += 1;
    need = Math.max(1, xpToNextLevel(lvl, need));
    apGained += lvl * 2;
  }

  return {
    level: lvl,
    levelXp: xp,
    nextLevelXp: need,
    levelsGained,
    apGained,
  };
}