import { useEffect, useState } from "react";
import { ROOM_MODES, getStartMs, subscribeToAllRooms, type Room } from "./rooms";

export default function AdminPanel({ onSpectate }: { onSpectate: (roomId: string) => void }) {
  // undefined = still loading
  const [rooms, setRooms] = useState<Room[] | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(
    () =>
      subscribeToAllRooms(setRooms, (err) => {
        console.error(err);
        setFailed(true);
      }),
    []
  );

  // Newest rooms first
  const sorted = rooms
    ? [...rooms].sort(
        (a, b) =>
          (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now())
      )
    : [];

  return (
    <section className="box admin-panel">
      <h2>Admin: spectate a room</h2>

      {failed ? (
        <p className="error">Couldn't load rooms. Check that your Firestore rules are published.</p>
      ) : !rooms ? (
        <p>Loading rooms...</p>
      ) : rooms.length === 0 ? (
        <p className="log-empty">No rooms are live right now.</p>
      ) : (
        <div className="table-scroll">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Code</th>
                <th>Type</th>
                <th>Players</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((room) => (
                <tr key={room.id}>
                  <td>{room.name}</td>
                  <td className="room-code">{room.id}</td>
                  <td>{ROOM_MODES.find((m) => m.id === room.mode)?.label ?? room.mode}</td>
                  <td>
                    {Object.keys(room.members).length}/{room.maxPlayers}
                  </td>
                  <td>{getStartMs(room) === null ? "Waiting to start" : "In progress"}</td>
                  <td>
                    <button onClick={() => onSpectate(room.id)}>Spectate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}