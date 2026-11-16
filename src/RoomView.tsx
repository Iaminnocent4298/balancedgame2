import { lazy, Suspense, useState } from "react";
import { getStartMs, leaveRoom, startGame } from "./rooms";
import { isDead } from "./stats";
import { popupMessages } from "./PopupMessages";
import RoomInfo from "./RoomInfo";
import TabBar from "./TabBar";
import { usePopup } from "./usePopup";
import { useRoomData } from "./useRoomData";

const StatsTab = lazy(() => import("./StatsTab"));
const ActionTab = lazy(() => import("./ActionTab"));
const LogTab = lazy(() => import("./LogTab"));
const ChangelogTab = lazy(() => import("./ChangelogTab"));

const TABS = [
  { id: "stats", label: "Stats" },
  { id: "action", label: "Action" },
  { id: "log", label: "Log" },
  { id: "changelog", label: "Changelog" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function RoomView({ uid, roomId }: { uid: string; roomId: string }) {
  const { showPopup } = usePopup();
  const [starting, setStarting] = useState(false);
  const [tab, setTab] = useState<TabId>("stats");

  const { room, players } = useRoomData(); // room: undefined = loading, null = doesn't exist

  if (room === undefined) return <p>Loading room...</p>;
  if (room === null) {
    return (
      <div className="box">
        <p>This room no longer exists.</p>
        <button onClick={() => leaveRoom(uid)}>Back to lobby</button>
      </div>
    );
  }

  const started = getStartMs(room) !== null;
  const isHost = room.hostId === uid;
  const memberCount = Object.keys(room.members).length;

  // Dead players can only spectate
  const dead = isDead(players?.find((p) => p.id === uid)?.stats);
  const deadIds = new Set((players ?? []).filter((p) => isDead(p.stats)).map((p) => p.id));

  async function handleStart() {
    setStarting(true);
    try {
      await startGame(uid, roomId);
    } catch (err) {
      if (!(err instanceof Error)) console.error(err);
      showPopup(popupMessages.room.startFailure(err));
    } finally {
      setStarting(false);
    }
  }

  return (
    <div>
      <RoomInfo room={room} />

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

          <TabBar tabs={TABS} active={tab} onChange={setTab} />

          <main role="tabpanel">
            <Suspense fallback={<p>Loading tab...</p>}>
              {tab === "stats" && <StatsTab uid={uid} />}
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
            </Suspense>
          </main>
        </>
      )}
    </div>
  );
}