import GameClock from "./GameClock";
import { ROOM_MODES, getStartMs, type Room } from "./rooms";

// The "Room info" and "Game info" boxes shown above everything in a room.
// A spectating admin also sees who the host is and whether the game has started.
export default function RoomInfo({ room, spectating = false }: { room: Room; spectating?: boolean }) {
  const modeLabel = ROOM_MODES.find((m) => m.id === room.mode)?.label ?? room.mode;

  return (
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
          {spectating && (
            <>
              <li>Host: {room.members[room.hostId] ?? "?"}</li>
              <li>Status: {getStartMs(room) !== null ? "In progress" : "Waiting to start"}</li>
            </>
          )}
        </ul>
      </section>

      <section className="box info-box">
        <h2>Game info</h2>
        <GameClock room={room} />
      </section>
    </div>
  );
}
