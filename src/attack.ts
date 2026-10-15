import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { getAttackDamage, resolveHit } from "./attackCalc";
import type { Enhancements, Equipment } from "./equipment";
import { ITEMS } from "./itemCatalog";
import { ATTACK_SLOTS, ATTACK_VERBS, type ItemTypeId } from "./items";
import { applyXp } from "./leveling";
import { pushLog, type LogEntry } from "./log";
import { getBreakdowns } from "./statCalc";
import { DEFAULT_STATS, type Stats } from "./stats";

export type AttackFailure =
  | "no_item"
  | "target_gone"
  | "target_down"
  | "attacker_dead"
  | "not_started"
  | "invalid";

// Thrown for problems the player should be told about
export class AttackError extends Error {
  reason: AttackFailure;
  constructor(reason: AttackFailure, message: string) {
    super(message);
    this.reason = reason;
  }
}

export type AttackResult = {
  damage: number; // final damage dealt
  crit: boolean;
  targetHealth: number; // the target's health after the hit
  xpGained: number;
  coinsGained: number;
  levelsGained: number;
  apGained: number;
};

type PlayerData = {
  name?: string;
  roomId?: string | null;
  stats?: Stats;
  points?: Stats;
  equipment?: Equipment;
  enhancements?: Enhancements;
};

export async function performAttack(
  attackerId: string,
  targetId: string,
  slot: ItemTypeId // which equipped item the attack is made with
): Promise<AttackResult> {
  if (!ATTACK_SLOTS.includes(slot)) {
    throw new AttackError("invalid", "That can't be used to attack.");
  }

  const attackerRef = doc(db, "players", attackerId);
  const targetRef = doc(db, "players", targetId);
  const selfHit = attackerId === targetId;

  return runTransaction(db, async (tx) => {
    // Everything is read first, so the maths always uses the latest data
    const attacker = (await tx.get(attackerRef)).data() as PlayerData | undefined;
    const target = selfHit ? attacker : ((await tx.get(targetRef)).data() as PlayerData | undefined);

    if (!attacker?.roomId) throw new AttackError("invalid", "You're not in a room.");
    if (!target || target.roomId !== attacker.roomId) {
      throw new AttackError("target_gone", "That player isn't in your room any more.");
    }

    const roomRef = doc(db, "rooms", attacker.roomId);
    const roomSnap = await tx.get(roomRef);

    if (roomSnap.exists() && roomSnap.data().startedAt === null) {
      throw new AttackError("not_started", "The game hasn't started yet.");
    }
    if ((attacker.stats?.health ?? DEFAULT_STATS.health) <= 0) {
      throw new AttackError(
        "attacker_dead",
        "You're dead, so you can't attack. You can only spectate."
      );
    }

    const equipment = attacker.equipment ?? {};
    const enhancements = attacker.enhancements ?? {};
    const item = ITEMS[equipment[slot] ?? ""];
    if (!item || item.type !== slot) {
      throw new AttackError("no_item", "That item is no longer equipped.");
    }

    const targetName = target.name ?? "That player";
    const targetHealth = target.stats?.health ?? DEFAULT_STATS.health;
    if (targetHealth <= 0) {
      throw new AttackError("target_down", `${targetName} is already down.`);
    }

    // 1) Base damage: the selected item, plus damage on your armour
    const mine = getBreakdowns(attacker.stats, attacker.points, equipment, enhancements);
    const theirs = getBreakdowns(target.stats, target.points, target.equipment, target.enhancements);
    const base = getAttackDamage(slot, equipment, enhancements).total;

    // 2-5) Crit roll, strength, crit damage, and the target's defence
    const hit = resolveHit({
      baseDamage: base,
      strength: mine.strength.total,
      critChance: mine.critChance.total,
      critDamage: mine.critDamage.total,
      defence: theirs.defence.total,
    });

    // 6) Damage to the target
    const newHealth = Math.max(0, targetHealth - hit.damage);

    // 7) XP equal to the damage, with level-ups. 8) Coins: damage / 10, floored
    const stats = attacker.stats ?? {};
    const progress = applyXp(
      stats.level ?? DEFAULT_STATS.level,
      stats.levelXp ?? DEFAULT_STATS.levelXp,
      stats.nextLevelXp ?? DEFAULT_STATS.nextLevelXp,
      hit.damage
    );
    const coinsGained = Math.floor(hit.damage / 10);

    const attackerUpdates: Record<string, number> = {
      "stats.level": progress.level,
      "stats.levelXp": progress.levelXp,
      "stats.nextLevelXp": progress.nextLevelXp,
      "stats.abilityPoints": (stats.abilityPoints ?? DEFAULT_STATS.abilityPoints) + progress.apGained,
      "stats.coins": (stats.coins ?? DEFAULT_STATS.coins) + coinsGained,
    };

    if (selfHit) {
      tx.update(attackerRef, { ...attackerUpdates, "stats.health": newHealth });
    } else {
      if (newHealth < targetHealth) tx.update(targetRef, { "stats.health": newHealth });
      tx.update(attackerRef, attackerUpdates);
    }

    // The log lines, added in the same step as the damage. The log is newest-first,
    // so the death message (added second) sits directly above the final hit.
    if (roomSnap.exists()) {
      const now = Date.now();
      const victim = target.name ?? "Player";
      let log = pushLog(roomSnap.data().log as LogEntry[] | undefined, {
        kind: "attack",
        at: now,
        attacker: attacker.name ?? "Player",
        victim,
        verb: ATTACK_VERBS[slot] ?? "attacked",
        damage: hit.damage,
        crit: hit.crit,
      });
      if (newHealth <= 0) log = pushLog(log, { kind: "death", at: now, player: victim });
      tx.update(roomRef, { log });
    }

    return {
      damage: hit.damage,
      crit: hit.crit,
      targetHealth: newHealth,
      xpGained: hit.damage,
      coinsGained,
      levelsGained: progress.levelsGained,
      apGained: progress.apGained,
    };
  });
}