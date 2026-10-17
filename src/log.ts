import { getGameTime } from "./gameClock";
import type { RoomMode } from "./rooms";
import { formatNumber as round2, pad } from "./format";

export const LOG_LIMIT = 50; // oldest entries are dropped beyond this

type AttackLogEntry = {
  kind: "attack";
  at: number; // real-world time of the event (ms since 1970)
  attacker: string;
  victim: string;
  verb: string; // "bonked", "spelled", ...
  damage: number;
  crit: boolean;
};

// Add new kinds of log messages here later, e.g. `AttackLogEntry | PurchaseLogEntry`,
// and give each one a case in describeEntry below.
type DeathLogEntry = {
  kind: "death";
  at: number;
  player: string;
};

type HealLogEntry = {
  kind: "heal";
  at: number;
  healer: string;
  patient: string;
  amount: number; // health actually restored
};

export type LogEntry = AttackLogEntry | DeathLogEntry | HealLogEntry;

// Newest first, capped at LOG_LIMIT
export function pushLog(log: LogEntry[] | undefined, entry: LogEntry): LogEntry[] {
  return [entry, ...(log ?? [])].slice(0, LOG_LIMIT);
}

// The message text for an entry
export type SegmentKind = "name" | "damage" | "heal" | "crit";
export type Segment = { text: string; kind?: SegmentKind };

// A log line as pieces, so names and amounts can be coloured separately
export function describeParts(entry: LogEntry): Segment[] {
  switch (entry.kind) {
    case "attack":
      return [
        ...(entry.crit ? [{ text: " (Crit!)", kind: "crit" as const }] : []),
        { text: entry.attacker, kind: "name" },
        { text: ` ${entry.verb} ` },
        { text: entry.victim, kind: "name" },
        { text: " for " },
        { text: `${round2(entry.damage)} damage`, kind: "damage" },
      ];
    case "death":
      return [{ text: entry.player, kind: "name" }, { text: " has died!" }];
    case "heal":
      return [
        { text: entry.healer, kind: "name" },
        { text: " healed " },
        { text: entry.patient, kind: "name" },
        { text: " for " },
        { text: `${round2(entry.amount)} health`, kind: "heal" },
      ];
  }
}

// The same line as plain text
export const describeEntry = (entry: LogEntry): string =>
  describeParts(entry).map((s) => s.text).join("");

export type StampStyle = "game" | "real";

// "real" = the viewer's local time, e.g. 15:42:07
// "game" = the room's calendar and clock at that moment, e.g. Y3 Mid Summer 08:43
export function formatStamp(
  at: number,
  style: StampStyle,
  mode: RoomMode,
  roomStartMs: number
): string {
  if (style === "real") {
    const d = new Date(at);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  const t = getGameTime(mode, roomStartMs, at);
  return `Y${t.year} ${t.month} ${pad(t.hour)}:${pad(t.minute)}`;
}