import { useEffect, useState } from "react";
import { getGameTime } from "./gameClock";
import type { Room } from "./rooms";

const pad = (n: number) => String(n).padStart(2, "0");

export default function GameClock({ room }: { room: Room }) {
  const [now, setNow] = useState(() => Date.now());

  // Re-check the time 10 times a second. This is local only: no network use.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const startedAt = room.createdAt?.toMillis() ?? now;
  const t = getGameTime(room.mode, startedAt, now);

  return (
    <div>
      <div style={{ fontFamily: "monospace", fontSize: "2em" }}>
        {pad(t.hour)}:{pad(t.minute)}
      </div>
      <div>
        {t.month}, Year {t.year}
      </div>
    </div>
  );
}