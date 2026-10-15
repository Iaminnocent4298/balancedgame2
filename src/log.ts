import { getGameTime } from "./gameClock";
import type { RoomMode } from "./rooms";

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

export type LogEntry = AttackLogEntry | DeathLogEntry;

// Newest first, capped at LOG_LIMIT
export function pushLog(log: LogEntry[] | undefined, entry: LogEntry): LogEntry[] {
  return [entry, ...(log ?? [])].slice(0, LOG_LIMIT);
}

const round2 = (v: number) => String(Math.round(v * 100) / 100);
const pad = (n: number) => String(n).padStart(2, "0");

// The message text for an entry
export function describeEntry(entry: LogEntry): string {
  switch (entry.kind) {
    case "attack":
      return (
        `${entry.attacker} ${entry.verb} ${entry.victim} for ${round2(entry.damage)} damage` +
        (entry.crit ? " (critical hit!)" : "")
      );
    case "death":
      return `${entry.player} has died!`;
  }
}

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