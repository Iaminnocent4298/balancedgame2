import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { getAttackDamage, getHealing, resolveHit } from "./attackCalc";
import { getEquippedItem } from "./catalog";
import { getAttackCooldownMs } from "./cooldowns";
import { formatCountdown, round2 } from "./format";
import { ACTION_KINDS, ATTACK_VERBS, type SlotId } from "./items";
import { applyXp } from "./leveling";
import { pushLog, type LogEntry } from "./log";
import type { PlayerDoc } from "./player";
import { computeRegen, getRegenTick, regenWrite, vitalsOf, type RegenResult, type Vitals } from "./regen";
import { MAX_PLAYERS, getStartMs, type Room } from "./rooms";
import { getBreakdowns } from "./statCalc";
import { withDefaults } from "./stats";

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

// One chosen player, with their health, mana, and coins as they are right now
type Target = {
  id: string;
  data: PlayerDoc;
  self: boolean;
  regen: RegenResult | null; // regen they had earned but not yet been paid
  vitals: Vitals;
  startHealth: number;
};

// Uses the item in `slot` (a weapon or a spell) on one or more players. A single-target item needs
// exactly one target. A multi-target item takes one to eight and is charged only once.
// Everything happens in one step: the effects, the mana cost, the cooldown, the rewards, and the log.
export async function performAction(
  actorId: string,
  targetIds: readonly string[],
  slot: SlotId
): Promise<ActionResult[]> {
  const ids = [...new Set(targetIds)];
  if (ids.length === 0 || ids.length > MAX_PLAYERS) {
    throw new ActionError("invalid", `Choose between 1 and ${MAX_PLAYERS} targets.`);
  }
  if (ids.length !== targetIds.length) {
    throw new ActionError("invalid", "A target can only be selected once.");
  }

  const actorRef = doc(db, "players", actorId);

  return runTransaction(db, async (tx) => {
    // Everything is read first, so the maths always uses the latest data
    const actor = (await tx.get(actorRef)).data() as PlayerDoc | undefined;
    if (!actor?.roomId) throw new ActionError("invalid", "You're not in a room :c");

    const chosen: { id: string; data: PlayerDoc; self: boolean }[] = [];
    for (const id of ids) {
      const self = id === actorId;
      const data = self ? actor : ((await tx.get(doc(db, "players", id))).data() as PlayerDoc | undefined);
      if (!data || data.roomId !== actor.roomId) {
        throw new ActionError("target_gone", "That player left because they're a coward smh");
      }
      chosen.push({ id, data, self });
    }

    const roomRef = doc(db, "rooms", actor.roomId);
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new ActionError("invalid", "This room no longer exists :c");

    const room = roomSnap.data() as Omit<Room, "id">;
    const startMs = getStartMs(room);
    if (startMs === null) throw new ActionError("not_started", "The game hasn't started yet, be patient... gosh");
    const now = Date.now();
    const tick = getRegenTick(room.mode, startMs, now);

    // Regen each player has earned up to this moment (they may not have been online to collect it)
    const actorRegen = computeRegen(actor, tick);
    const actorVitals = vitalsOf(actor.stats, actorRegen);
    if (actorVitals.health <= 0) {
      throw new ActionError("actor_dead", "You're dead. This isn't BOTC, so you can only spectate.");
    }

    // Hitting yourself shares the actor's numbers, so a change to one is a change to both
    const targets: Target[] = chosen.map((c) => {
      const regen = c.self ? actorRegen : computeRegen(c.data, tick);
      const vitals = c.self ? actorVitals : vitalsOf(c.data.stats, regen);
      return { ...c, regen, vitals, startHealth: vitals.health };
    });

    // The item being used, and what it does
    const equipment = actor.equipment ?? {};
    const enhancements = actor.enhancements ?? {};
    const item = getEquippedItem(equipment, slot);
    if (!item) {
      throw new ActionError("no_item", "That item has vanished... just kidding you removed it yourself");
    }
    const kind = ACTION_KINDS[item.type];
    if (!kind || !item.attackMode) throw new ActionError("invalid", `${item.name} can't be used yet.`);
    if (item.attackMode === "single" && targets.length !== 1) {
      throw new ActionError("invalid", `${item.name} can only be used on one target.`);
    }
    if (item.attackMode === "multi" && kind !== "attack") {
      throw new ActionError("invalid", `${item.name} can't be used for a multi attack.`);
    }

    // The weapon has a cooldown. Spells don't: they cost mana instead
    const mine = getBreakdowns(actor.stats, actor.points, equipment, enhancements);
    const cooldownMs = getAttackCooldownMs(slot, room.mode, mine.attackSpeed.total);
    const readyAt = actor.cooldowns?.[slot] ?? 0;
    if (cooldownMs > 0 && now < readyAt) {
      throw new ActionError(
        "on_cooldown",
        `${item.name} is on cooldown for ${formatCountdown(readyAt - now)}.`
      );
    }

    for (const t of targets) {
      if (t.vitals.health <= 0) {
        throw new ActionError(
          "target_down",
          kind === "heal" ? `Healing them is no use, they're already dead.` : `Why would you attack a dead player?`
        );
      }
    }

    const manaCost = item.manaCost ?? 0;
    if (actorVitals.mana < manaCost) {
      throw new ActionError(
        "not_enough_mana",
        `You need ${manaCost} mana to cast this spell, which is clearly too much for your current mana bar`
      );
    }

    // Apply the item to each target
    const actorStats = withDefaults(actor.stats);
    const actorName = actor.name ?? "Player";
    const entries: LogEntry[] = []; // in the order things happened
    const results: ActionResult[] = [];
    const baseDamage = kind === "attack" ? getAttackDamage(slot, equipment, enhancements).total : 0;
    // XP carries from one target to the next, so a big multi-hit can level you up part way through
    let progress = { ...actorStats };
    let earnedXp = false;

    for (const t of targets) {
      const targetName = t.data.name ?? "Player";
      const theirs = getBreakdowns(t.data.stats, t.data.points, t.data.equipment, t.data.enhancements);

      if (kind === "heal") {
        // A flat amount and/or a percentage of the target's max health, never past the max
        const { raw, percent } = getHealing(slot, equipment, enhancements);
        const maxHealth = Math.max(1, theirs.maxHealth.total);
        const amount = raw + (maxHealth * percent) / 100;
        if (!(amount > 0)) throw new ActionError("invalid", `That item doesn't perform healing capabilities`);

        const newHealth = round2(Math.min(maxHealth, t.vitals.health + amount));
        const healed = round2(newHealth - t.vitals.health);
        if (healed <= 0) {
          // Refused before anything is charged, so no mana is wasted
          throw new ActionError("nothing_to_heal", `They're already at max hp, why would you heal them?`);
        }

        t.vitals.health = newHealth;
        entries.push({ kind: "heal", at: now, healer: actorName, patient: targetName, amount: healed });
        results.push({ kind: "heal", healed, targetHealth: newHealth });
        continue;
      }

      // Crit roll, strength, crit damage, and the target's defence
      const hit = resolveHit({
        baseDamage,
        strength: mine.strength.total,
        critChance: mine.critChance.total,
        critDamage: mine.critDamage.total,
        defence: theirs.defence.total,
      });
      const newHealth = Math.max(0, t.vitals.health - hit.damage);
      t.vitals.health = newHealth;

      // XP equal to the damage, with level-ups. Hitting yourself earns nothing.
      // Coins are not earned from damage: they arrive on the coin tick (regen.ts).
      const xp = t.self
        ? null
        : applyXp(progress.level, progress.levelXp, progress.nextLevelXp, hit.damage);
      if (xp) {
        earnedXp = true;
        progress = {
          ...progress,
          level: xp.level,
          levelXp: xp.levelXp,
          nextLevelXp: xp.nextLevelXp,
          abilityPoints: progress.abilityPoints + xp.apGained,
        };
      }

      entries.push({
        kind: "attack",
        at: now,
        attacker: actorName,
        victim: targetName,
        verb: ATTACK_VERBS[item.type] ?? "attacked",
        damage: hit.damage,
        crit: hit.crit,
      });
      // The death message comes after the final hit, so it sits above it in the newest-first log
      if (newHealth <= 0) entries.push({ kind: "death", at: now, player: targetName });

      results.push({
        kind: "attack",
        damage: hit.damage,
        crit: hit.crit,
        targetHealth: newHealth,
        xpGained: xp ? hit.damage : 0,
        levelsGained: xp?.levelsGained ?? 0,
        apGained: xp?.apGained ?? 0,
      });
    }

    // Spend mana (spells), start the cooldown (weapon), and bank the XP
    actorVitals.mana -= manaCost;
    const actorExtra: Record<string, number> = {};
    if (cooldownMs > 0) actorExtra[`cooldowns.${slot}`] = now + cooldownMs;
    if (earnedXp) {
      Object.assign(actorExtra, {
        "stats.level": progress.level,
        "stats.levelXp": progress.levelXp,
        "stats.nextLevelXp": progress.nextLevelXp,
        "stats.abilityPoints": progress.abilityPoints,
      });
    }

    // Write everything: each player's health and mana (with any regen collected), and the log
    tx.update(actorRef, { ...regenWrite(actorVitals, actorRegen), ...actorExtra });
    for (const t of targets) {
      if (t.self || (!t.regen && t.vitals.health === t.startHealth)) continue;
      tx.update(doc(db, "players", t.id), regenWrite(t.vitals, t.regen));
    }

    let log = room.log;
    for (const entry of entries) log = pushLog(log, entry);
    tx.update(roomRef, { log });

    return results;
  });
}
