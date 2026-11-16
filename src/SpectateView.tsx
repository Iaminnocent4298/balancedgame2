import { useState } from "react";
import { useRoomData } from "./useRoomData";
import LogTab from "./LogTab";
import RoomInfo from "./RoomInfo";
import StatsTab from "./StatsTab";
import TabBar from "./TabBar";

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

  return (
    <div>
      <div className="box spectate-banner">
        👁 Spectating. You can see everything, but you can't take part.
      </div>

      <RoomInfo room={room} spectating />

      <div className="center-row">
        <button onClick={onExit}>Stop spectating</button>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <main role="tabpanel">
        {tab === "stats" && <StatsTab uid={uid} />}
        {tab === "log" && <LogTab room={room} />}
      </main>
    </div>
  );
}