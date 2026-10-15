import { useEffect, useState } from "react";
import { getGameTime } from "./gameClock";
import { getStartMs, type Room } from "./rooms";

const pad = (n: number) => String(n).padStart(2, "0");

export default function GameClock({ room }: { room: Room }) {
  const [now, setNow] = useState(() => Date.now());
  const startedAt = getStartMs(room);
  const started = startedAt !== null;

  // Re-check the time 10 times a second. This is local only: no network use.
  useEffect(() => {
    if (!started) return; // nothing to tick until the game starts
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [started]);

  if (startedAt === null) {
    return (
      <ul className="info-list">
        <li>Status: Not started</li>
      </ul>
    );
  }

  const t = getGameTime(room.mode, startedAt, now);

  return (
    <ul className="info-list">
      <li>
        Time:{" "}
        <span className="clock">
          {pad(t.hour)}:{pad(t.minute)}
        </span>
      </li>
      <li>
        Month: <span className={`season-${t.season.toLowerCase()}`}>{t.month}</span>
      </li>
      <li>Season: {t.season}</li>
      <li>
        Year: <span className="year">{t.year}</span>
      </li>
    </ul>
  );
}