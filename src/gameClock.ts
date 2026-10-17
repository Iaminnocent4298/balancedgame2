import type { RoomMode } from "./rooms";

const MINUTE = 60_000;

// ===== Game speed: THE ONLY PLACE to change it =====
// Everything timed is written for Speed mode, then multiplied by these.
// Keep them whole numbers so every duration stays a clean number.
export const TIME_MULTIPLIER: Record<RoomMode, number> = {
  speed: 1,
  normal: 30, // a day takes 15x as long as in Speed
  daily: 720, // a day takes 360x as long as in Speed
};

// Real-world length of one in-game day in Speed mode
const SPEED_DAY_MS = MINUTE;

// Real-world length of one in-game day in each mode (what the clock uses)
export const DAY_LENGTH_MS: Record<RoomMode, number> = {
  speed: SPEED_DAY_MS * TIME_MULTIPLIER.speed, //  2 minutes
  normal: SPEED_DAY_MS * TIME_MULTIPLIER.normal, // 30 minutes
  daily: SPEED_DAY_MS * TIME_MULTIPLIER.daily, //  12 hours
};

// Converts a duration written for Speed mode into real milliseconds
// for the given mode. USE THIS for cooldowns, regen ticks, and so on.
export function scaleToMode(speedMs: number, mode: RoomMode): number {
  return speedMs * TIME_MULTIPLIER[mode];
}

// One in-game hour lasts exactly 5 seconds in Speed mode (2 minutes / 24)
const SPEED_GAME_HOUR_MS = SPEED_DAY_MS / 24;

// Converts a number of in-game hours into real milliseconds,
// e.g. gameHoursToMs(2, mode) for "a cooldown of 2 game hours".
export function gameHoursToMs(hours: number, mode: RoomMode): number {
  return hours * SPEED_GAME_HOUR_MS * TIME_MULTIPLIER[mode];
}

const SEASONS = ["Winter", "Spring", "Summer", "Fall"] as const;
const PARTS = ["Early", "Mid", "Late"] as const;
export const MONTHS_PER_YEAR = SEASONS.length * PARTS.length; // 12

export type GameTime = {
  hour: number; // 0-23
  minute: number; // 0-59
  month: string; // e.g. "Early Winter"
  season: (typeof SEASONS)[number]; // "Winter" | "Spring" | "Summer" | "Fall"
  year: number; // starts at 1
};

export function getGameTime(mode: RoomMode, startedAtMs: number, nowMs: number): GameTime {
  const dayLength = DAY_LENGTH_MS[mode];
  const elapsed = Math.max(0, nowMs - startedAtMs);

  const dayIndex = Math.floor(elapsed / dayLength); // whole game days so far
  const dayFraction = (elapsed % dayLength) / dayLength; // how far through today
  const minutesIntoDay = Math.floor(dayFraction * 24 * 60);

  const monthIndex = dayIndex % MONTHS_PER_YEAR; // each day = next "month"

  const season = SEASONS[Math.floor(monthIndex / 3)];

  return {
    hour: Math.floor(minutesIntoDay / 60),
    minute: minutesIntoDay % 60,
    month: `${PARTS[monthIndex % 3]} ${season}`,
    season,
    year: Math.floor(dayIndex / MONTHS_PER_YEAR) + 1,
  };
}

// ===== Seasons (used by the rotating shop) =====
export const DAYS_PER_SEASON = PARTS.length; // 3: one season = Early + Mid + Late

export function getSeasonInfo(mode: RoomMode, startedAtMs: number, nowMs: number) {
  const seasonLength = DAYS_PER_SEASON * DAY_LENGTH_MS[mode];
  const elapsed = Math.max(0, nowMs - startedAtMs);
  return {
    seasonIndex: Math.floor(elapsed / seasonLength), // 0, 1, 2... counted from the room's start
    msRemaining: seasonLength - (elapsed % seasonLength), // real time until the next season
  };
}