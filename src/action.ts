import { doc, runTransaction, type Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { getAttackDamage, getHealing, resolveHit } from "./attackCalc";
import { getAttackCooldownMs } from "./cooldowns";
import type { Cooldowns, Enhancements, Equipment } from "./equipment";
import { formatCountdown } from "./format";
import { getEquippedItem } from "./catalog";
import { ACTION_KINDS, ATTACK_VERBS, type SlotId } from "./items";
import { applyXp } from "./leveling";
import { pushLog, type LogEntry } from "./log";
import { computeRegen, getRegenTick, type RegenResult } from "./regen";
import type { RoomMode } from "./rooms";
import { getBreakdowns } from "./statCalc";
import { withDefaults, type Stats } from "./stats";
import { round2 } from "./format";

export type ActionFailure =
  | "no_item"
  | "target_gone"
  | "target_down"
  | "actor_dead"
  | "not_started"
  | "on_cooldown"
  | "not_enough_mana"
  | "nothing_to_heal"
  | "invalid";

// Thrown for problems the player should be told about
export class ActionError extends Error {
  reason: ActionFailure;
  constructor(reason: ActionFailure, message: string) {
    super(message);
    this.reason = reason;
  }
}

export type ActionResult =
  | {
      kind: "attack";
      damage: number;
      crit: boolean;
      targetHealth: number;
      xpGained: number;
      levelsGained: number;
      apGained: number;
    }
  | { kind: "heal"; healed: number; targetHealth: number };

type PlayerData = {
  name?: string;
  roomId?: string | null;
  stats?: Stats;
  points?: Stats;
  equipment?: Equipment;
  enhancements?: Enhancements;
  cooldowns?: Cooldowns;
  regenTick?: number;
};

type Vitals = { health: number; mana: number; coins: number };

// Uses the item in `slot` (a weapon or a spell) on `targetId`. Everything happens in one
// step: the effect, the mana cost, the cooldown, the rewards, and the log line.
export async function performAction(
  actorId: string,
  targetId: string,
  slot: SlotId
): Promise<ActionResult> {
  const actorRef = doc(db, "players", actorId);
  const targetRef = doc(db, "players", targetId);
  const selfTarget = actorId === targetId;

  return runTransaction(db, async (tx) => {
    // Everything is read first, so the maths always uses the latest data
    const actor = (await tx.get(actorRef)).data() as PlayerData | undefined;
    const target = selfTarget ? actor : ((await tx.get(targetRef)).data() as PlayerData | undefined);

    if (!actor?.roomId) throw new ActionError("invalid", "You're not in a room :c");
    if (!target || target.roomId !== actor.roomId) {
      throw new ActionError("target_gone", "That player left because they're a coward smh");
    }

    const roomRef = doc(db, "rooms", actor.roomId);
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new ActionError("invalid", "This room no longer exists :c");

    const room = roomSnap.data();
    const startedAt = (room.startedAt === undefined ? room.createdAt : room.startedAt) as
      | Timestamp
      | null
      | undefined;
    if (!startedAt) throw new ActionError("not_started", "The game hasn't started yet, be patient... gosh");
    const mode = room.mode as RoomMode;
    const now = Date.now();
    const tick = getRegenTick(mode, startedAt.toMillis(), now);

    // Regen each player has earned up to this moment (they may not have been online to collect it)
    const actorRegen = computeRegen(actor, tick);
    const targetRegen = selfTarget ? actorRegen : computeRegen(target, tick);

    const actorStats = withDefaults(actor.stats);
    const targetStats = withDefaults(target.stats);
    const actorVitals: Vitals = {
      health: actorRegen?.health ?? actorStats.health,
      mana: actorRegen?.mana ?? actorStats.mana,
      coins: actorRegen?.coins ?? actorStats.coins,
    };
    const targetVitals: Vitals = selfTarget
      ? actorVitals // the same person, so changes to one are changes to both
      : {
          health: targetRegen?.health ?? targetStats.health,
          mana: targetRegen?.mana ?? targetStats.mana,
          coins: targetRegen?.coins ?? targetStats.coins,
        };
    const targetStartHealth = targetVitals.health;

    if (actorVitals.health <= 0) {
      throw new ActionError("actor_dead", "You're dead. This isn't BOTC, so you can only spectate.");
    }

    // The item being used, and what it does
    const equipment = actor.equipment ?? {};
    const enhancements = actor.enhancements ?? {};
    const item = getEquippedItem(equipment, slot);
    if (!item) {
      throw new ActionError("no_item", "That item has vanished... just kidding you removed it yourself");
    }
    const kind = ACTION_KINDS[item.type];
    if (!kind) throw new ActionError("invalid", `${item.name} can't be used yet.`);

    // The weapon has a cooldown. Spells don't: they cost mana instead
    const cooldownMs = getAttackCooldownMs(slot, mode);
    const readyAt = actor.cooldowns?.[slot] ?? 0;
    if (cooldownMs > 0 && now < readyAt) {
      throw new ActionError(
        "on_cooldown",
        `${item.name} is on cooldown for ${formatCountdown(readyAt - now)}.`
      );
    }

    if (targetVitals.health <= 0) {
      throw new ActionError(
        "target_down",
        kind === "heal" ? `Healing them is no use, they're already dead.` : `Why would you attack a dead player?`
      );
    }

    const manaCost = item.manaCost ?? 0;
    if (actorVitals.mana < manaCost) {
      throw new ActionError(
        "not_enough_mana",
        `You need ${manaCost} mana to cast this spell, which is clearly too much for your current mana bar`
      );
    }

    const theirs = getBreakdowns(target.stats, target.points, target.equipment, target.enhancements);
    const actorName = actor.name ?? "Player";
    const targetLogName = target.name ?? "Player";
    const actorExtra: Record<string, number> = {};
    const entries: LogEntry[] = []; // in the order things happened
    let result: ActionResult;

    if (kind === "heal") {
      // A flat amount and/or a percentage of the target's max health, never past the max
      const { raw, percent } = getHealing(slot, equipment, enhancements);
      const maxHealth = Math.max(1, theirs.maxHealth.total);
      const amount = raw + (maxHealth * percent) / 100;
      if (!(amount > 0)) throw new ActionError("invalid", `That item doesn't perform healing capabilities`);

      const newHealth = round2(Math.min(maxHealth, targetVitals.health + amount));
      const healed = round2(newHealth - targetVitals.health);
      if (healed <= 0) {
        // Refused before anything is charged, so no mana is wasted
        throw new ActionError("nothing_to_heal", `They're already at max hp, why would you heal them?`);
      }

      targetVitals.health = newHealth;
      entries.push({
        kind: "heal", at: now, healer: actorName, patient: targetLogName, amount: healed,
      });
      result = { kind: "heal", healed, targetHealth: newHealth };
    } else {
      // 1) Base damage: the selected item, plus damage on your armour
      const mine = getBreakdowns(actor.stats, actor.points, equipment, enhancements);
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
      const newHealth = Math.max(0, targetVitals.health - hit.damage);
      targetVitals.health = newHealth;

      // 7) XP equal to the damage, with level-ups. Hitting yourself earns nothing.
      // Coins are no longer earned from damage: they arrive on the coin tick (regen.ts).
      const progress = selfTarget
        ? null
        : applyXp(actorStats.level, actorStats.levelXp, actorStats.nextLevelXp, hit.damage);

      if (progress) {
        Object.assign(actorExtra, {
          "stats.level": progress.level,
          "stats.levelXp": progress.levelXp,
          "stats.nextLevelXp": progress.nextLevelXp,
          "stats.abilityPoints": actorStats.abilityPoints + progress.apGained,
        });
      }

      entries.push({
        kind: "attack",
        at: now,
        attacker: actorName,
        victim: targetLogName,
        verb: ATTACK_VERBS[item.type] ?? "attacked",
        damage: hit.damage,
        crit: hit.crit,
      });
      // The death message comes after the final hit, so it sits above it in the newest-first log
      if (newHealth <= 0) entries.push({ kind: "death", at: now, player: targetLogName });

      result = {
        kind: "attack",
        damage: hit.damage,
        crit: hit.crit,
        targetHealth: newHealth,
        xpGained: progress ? hit.damage : 0,
        levelsGained: progress?.levelsGained ?? 0,
        apGained: progress?.apGained ?? 0,
      };
    }

    // Spend mana (spells) and start the cooldown (weapon)
    actorVitals.mana -= manaCost;
    if (cooldownMs > 0) actorExtra[`cooldowns.${slot}`] = now + cooldownMs;

    // Write everything: each player's health and mana (with any regen collected)
    const vitalsWrite = (v: Vitals, regen: RegenResult | null): Record<string, number> => ({
      "stats.health": v.health,
      "stats.mana": v.mana,
      "stats.coins": v.coins,
      ...(regen ? { regenTick: regen.tick } : {}),
    });

    tx.update(actorRef, { ...vitalsWrite(actorVitals, actorRegen), ...actorExtra });
    if (!selfTarget && (targetRegen || targetVitals.health !== targetStartHealth)) {
      tx.update(targetRef, vitalsWrite(targetVitals, targetRegen));
    }

    let log = room.log as LogEntry[] | undefined;
    for (const entry of entries) log = pushLog(log, entry);
    tx.update(roomRef, { log });

    return result;
  });
}