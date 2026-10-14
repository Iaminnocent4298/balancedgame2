import { useEffect, useState } from "react";
import { ROOM_MODES, leaveRoom, subscribeToRoom, type Room } from "./rooms";
import GameClock from "./GameClock";
import StatsTab from "./StatsTab";
import ActionTab from "./ActionTab";
import ChangelogTab from "./ChangelogTab";

const TABS = [
  { id: "stats", label: "Stats" },
  { id: "action", label: "Action" },
  { id: "log", label: "Log" },
  { id: "changelog", label: "Changelog" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function RoomView({ uid, roomId }: { uid: string; roomId: string }) {
  // undefined = loading, null = room doesn't exist
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<TabId>("stats");

  useEffect(() => subscribeToRoom(roomId, setRoom), [roomId]);

  if (room === undefined) return <p>Loading room...</p>;
  if (room === null) {
    return (
      <div className="box">
        <p>This room no longer exists.</p>
        <button onClick={() => leaveRoom(uid)}>Back to lobby</button>
      </div>
    );
  }

  const modeLabel = ROOM_MODES.find((m) => m.id === room.mode)?.label ?? room.mode;

  async function copyCode() {
    await navigator.clipboard.writeText(room!.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      {/* Info boxes: always visible, whichever tab is open */}
      <div className="info-row">
        <section className="box info-box">
          <h2>Room info</h2>
          <ul className="info-list">
            <li>Name: {room.name}</li>
            <li>
              Code: <strong className="room-code">{room.id}</strong>{" "}
              <button onClick={copyCode}>{copied ? "Copied!" : "Copy"}</button>
            </li>
            <li>Type: {modeLabel}</li>
            <li>
              Players: {Object.keys(room.members).length}/{room.maxPlayers}
            </li>
          </ul>
        </section>

        <section className="box info-box">
          <h2>Game info</h2>
          <GameClock room={room} />
        </section>
      </div>

      <div className="center-row">
        <button onClick={() => leaveRoom(uid)}>Leave room</button>
      </div>

      {/* Navbar */}
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

      {/* Tab content */}
      <main role="tabpanel">
        {tab === "stats" && <StatsTab roomId={roomId} uid={uid} />}
        {tab === "action" && <ActionTab room={room} uid={uid} />}
        {tab === "log" && null}
        {tab === "changelog" && <ChangelogTab />}
      </main>
    </div>
  );
}