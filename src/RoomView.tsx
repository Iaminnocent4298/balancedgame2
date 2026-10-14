import { useEffect, useState } from "react";
import { ROOM_MODES, leaveRoom, subscribeToRoom, type Room } from "./rooms";
import GameClock from "./GameClock";

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
      <div>
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
      {/* Header: always visible, whichever tab is open */}
      <header>
        <h2>{room.name}</h2>
        <p>
          Room code:{" "}
          <strong style={{ fontFamily: "monospace", fontSize: "1.2em" }}>{room.id}</strong>{" "}
          <button onClick={copyCode}>{copied ? "Copied!" : "Copy"}</button>
        </p>
        <p>
          {modeLabel} mode - {Object.keys(room.members).length}/{room.maxPlayers} players
        </p>
        <GameClock room={room} />
        <p>
          <button onClick={() => leaveRoom(uid)}>Leave room</button>
        </p>
      </header>

      {/* Navbar */}
      <nav
        role="tablist"
        style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid currentColor" }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? "3px solid currentColor" : "3px solid transparent",
              fontWeight: tab === t.id ? "bold" : "normal",
              opacity: tab === t.id ? 1 : 0.6,
              padding: "0.5rem 1rem",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Tab content (all empty for now) */}
      <main role="tabpanel" style={{ minHeight: "12rem", paddingTop: "1rem" }}>
        {tab === "stats" && null}
        {tab === "action" && null}
        {tab === "log" && null}
        {tab === "changelog" && null}
      </main>
    </div>
  );
}