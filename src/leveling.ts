const APPERLEVEL = 10;
// XP needed for the level after `level`: the previous requirement (`prev`) plus 50 for every
// 5 levels. PLACEHOLDER curve: change it freely. The first requirement is the nextLevelXp default in stats.ts.
export const xpToNextLevel = (level: number, prev : number) => prev + Math.ceil(level/5) * 50;

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
    apGained += APPERLEVEL;
  }

  return {
    level: lvl,
    levelXp: xp,
    nextLevelXp: need,
    levelsGained,
    apGained,
  };
}