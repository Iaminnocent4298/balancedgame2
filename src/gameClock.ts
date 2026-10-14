import type { RoomMode } from "./rooms";

const MINUTE = 60_000;

// Real-world length of one in-game day (24 game hours)
export const DAY_LENGTH_MS: Record<RoomMode, number> = {
  daily: 360 * MINUTE, // 6 hours
  normal: 40 * MINUTE,
  speed: 5 * MINUTE,
};

const SEASONS = ["Winter", "Spring", "Summer", "Fall"] as const;
const PARTS = ["Early", "Mid", "Late"] as const;
export const MONTHS_PER_YEAR = SEASONS.length * PARTS.length; // 12

export type GameTime = {
  hour: number; // 0-23
  minute: number; // 0-59
  month: string; // e.g. "Early Winter"
  year: number; // starts at 1
};

export function getGameTime(mode: RoomMode, startedAtMs: number, nowMs: number): GameTime {
  const dayLength = DAY_LENGTH_MS[mode];
  const elapsed = Math.max(0, nowMs - startedAtMs);

  const dayIndex = Math.floor(elapsed / dayLength); // whole game days so far
  const dayFraction = (elapsed % dayLength) / dayLength; // how far through today
  const minutesIntoDay = Math.floor(dayFraction * 24 * 60);

  const monthIndex = dayIndex % MONTHS_PER_YEAR; // each day = next "month"

  return {
    hour: Math.floor(minutesIntoDay / 60),
    minute: minutesIntoDay % 60,
    month: `${PARTS[monthIndex % 3]} ${SEASONS[Math.floor(monthIndex / 3)]}`,
    year: Math.floor(dayIndex / MONTHS_PER_YEAR) + 1,
  };
}