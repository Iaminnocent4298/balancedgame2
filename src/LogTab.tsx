import { useState } from "react";
import { describeEntry, formatStamp, type StampStyle } from "./log";
import { getStartMs, type Room } from "./rooms";

const STORAGE_KEY = "balancedgame.logTimestamps";

// Remembers the player's choice between visits (falls back quietly if storage is blocked)
function loadStyle(): StampStyle {
  try {
    return localStorage.getItem(STORAGE_KEY) === "real" ? "real" : "game";
  } catch {
    return "game";
  }
}

export default function LogTab({ room }: { room: Room }) {
  const [style, setStyle] = useState<StampStyle>(loadStyle);

  function toggle() {
    const next: StampStyle = style === "game" ? "real" : "game";
    setStyle(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* not saved, but still works for this visit */
    }
  }

  const roomStart = getStartMs(room) ?? Date.now();
  const log = room.log ?? [];

  return (
    <div>
      <div className="log-bar">
        <button onClick={toggle}>
          Timestamps: {style === "game" ? "In-game" : "Real time"} (switch)
        </button>
      </div>

      <div className="box log-box">
        {log.length === 0 ? (
          <p className="log-empty">Nothing has happened yet.</p>
        ) : (
          <ol className="log-list">
            {log.map((entry, i) => (
              <li
                key={`${entry.at}-${i}`}
                className={entry.kind === "death" ? "log-death" : undefined}
              >
                <span className="log-time">
                  [{formatStamp(entry.at, style, room.mode, roomStart)}]
                </span>
                {describeEntry(entry)}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}