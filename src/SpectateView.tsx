import { useState } from "react";
import { ROOM_MODES, getStartMs } from "./rooms";
import { useRoomData } from "./useRoomData";
import GameClock from "./GameClock";
import StatsTab from "./StatsTab";
import LogTab from "./LogTab";

const TABS = [
  { id: "stats", label: "Stats" },
  { id: "log", label: "Log" },
] as const;
type TabId = (typeof TABS)[number]["id"];

type Props = { uid: string; onExit: () => void };

export default function SpectateView({ uid, onExit }: Props) {
  const { room } = useRoomData();
  const [tab, setTab] = useState<TabId>("stats");

  if (room === undefined) return <p>Loading room...</p>;
  if (room === null) {
    return (
      <div className="box">
        <p>This room no longer exists.</p>
        <button onClick={onExit}>Back to lobby</button>
      </div>
    );
  }

  const modeLabel = ROOM_MODES.find((m) => m.id === room.mode)?.label ?? room.mode;
  const started = getStartMs(room) !== null;

  return (
    <div>
      <div className="box spectate-banner">
        👁 Spectating. You can see everything, but you can't take part.
      </div>

      <div className="info-row">
        <section className="box info-box">
          <h2>Room info</h2>
          <ul className="info-list">
            <li>Name: {room.name}</li>
            <li>
              Code: <strong className="room-code">{room.id}</strong>
            </li>
            <li>Type: {modeLabel}</li>
            <li>
              Players: {Object.keys(room.members).length}/{room.maxPlayers}
            </li>
            <li>Host: {room.members[room.hostId] ?? "?"}</li>
            <li>Status: {started ? "In progress" : "Waiting to start"}</li>
          </ul>
        </section>

        <section className="box info-box">
          <h2>Game info</h2>
          <GameClock room={room} />
        </section>
      </div>

      <div className="center-row">
        <button onClick={onExit}>Stop spectating</button>
      </div>

      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            className="tab"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main role="tabpanel">
        {tab === "stats" && <StatsTab uid={uid} />}
        {tab === "log" && <LogTab room={room} />}
      </main>
    </div>
  );
}