import { useEffect, useState } from "react";
import {
  ROOM_MODES, getStartMs, leaveRoom, startGame, subscribeToRoom, subscribeToRoomPlayers,
  type Room, type RoomPlayer,
} from "./rooms";
import { isDead } from "./stats";
import GameClock from "./GameClock";
import StatsTab from "./StatsTab";
import ActionTab from "./ActionTab";
import LogTab from "./LogTab";
import ChangelogTab from "./ChangelogTab";
import { usePopup } from "./usePopup";
import { useRegen } from "./useRegen";

const TABS = [
  { id: "stats", label: "Stats" },
  { id: "action", label: "Action" },
  { id: "log", label: "Log" },
  { id: "changelog", label: "Changelog" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function RoomView({ uid, roomId }: { uid: string; roomId: string }) {
  const { showPopup } = usePopup();
  // undefined = loading, null = room doesn't exist
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [players, setPlayers] = useState<RoomPlayer[] | undefined>(undefined);
  // const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [tab, setTab] = useState<TabId>("stats");

  useEffect(() => subscribeToRoom(roomId, setRoom), [roomId]);
  useEffect(() => subscribeToRoomPlayers(roomId, setPlayers), [roomId]);

  // Collects your own health and mana regen as each tick comes due
  const me = players?.find((p) => p.id === uid);
  useRegen(uid, room, me ? (me.regenTick ?? 0) : null);

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
  const started = getStartMs(room) !== null;
  const isHost = room.hostId === uid;
  const memberCount = Object.keys(room.members).length;

  // Dead players can only spectate
  const dead = isDead(players?.find((p) => p.id === uid)?.stats);
  const deadIds = new Set((players ?? []).filter((p) => isDead(p.stats)).map((p) => p.id));

  // async function copyCode() {
  //   await navigator.clipboard.writeText(room!.id);
  //   setCopied(true);
  //   setTimeout(() => setCopied(false), 1500);
  // }

  async function handleStart() {
    setStarting(true);
    try {
      await startGame(uid, roomId);
    } catch (err) {
      showPopup({
        title: "Couldn't start",
        message: err instanceof Error ? err.message : "Something went wrong. Contact @iaminnocent4298 if this error persists.",
      });
    } finally {
      setStarting(false);
    }
  }

  return (
    <div>
      {/* Info boxes: always visible */}
      <div className="info-row">
        <section className="box info-box">
          <h2>Room info</h2>
          <ul className="info-list">
            <li>Name: {room.name}</li>
            <li>
              Code: <strong className="room-code">{room.id}</strong>{" "}
            </li>
            <li>Type: {modeLabel}</li>
            <li>
              Players: {memberCount}/{room.maxPlayers}
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

      {!started ? (
        // ----- Waiting room: nothing runs until the host starts -----
        <section className="box waiting">
          <h2>
            Players ({memberCount}/{room.maxPlayers})
          </h2>
          <ul className="info-list">
            {Object.entries(room.members).map(([id, name]) => (
              <li key={id}>
                {name}
                {id === room.hostId && " (host)"}
                {id === uid && " (you)"}
              </li>
            ))}
          </ul>
          {isHost ? (
            <>
              <p>
                Share the code <strong className="room-code">{room.id}</strong> with your friends.
                Nobody can join once the game starts.
              </p>
              <button disabled={starting} onClick={handleStart}>
                Start game
              </button>
            </>
          ) : (
            <p className="waiting-text">Waiting for host to start...</p>
          )}
        </section>
      ) : (
        // ----- Game running -----
        <>
          {dead && <div className="box dead-banner">☠ You have died. You can only spectate now.</div>}

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
            {tab === "stats" && <StatsTab room={room} uid={uid} />}
            {tab === "action" &&
              (dead ? (
                <p className="dead-note">
                  Dead players can't take actions. Follow the game on the Stats and Log tabs.
                </p>
              ) : (
                <ActionTab room={room} uid={uid} deadIds={deadIds} />
              ))}
            {tab === "log" && <LogTab room={room} />}
            {tab === "changelog" && <ChangelogTab />}
          </main>
        </>
      )}
    </div>
  );
}