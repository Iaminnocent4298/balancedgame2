import { useState } from "react";
import {
  ROOM_MODES, MIN_PLAYERS, MAX_PLAYERS,
  createRoom, joinRoom,
  type RoomMode,
} from "./rooms";

export default function RoomLobby({ uid }: { uid: string }) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<RoomMode>(ROOM_MODES[0].id);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setError("");
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-page">
      <div className="lobby">
        <section className="box lobby-box">
          <h2>Create a room</h2>
          <form
            className="form-col"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => createRoom(uid, { name, mode, maxPlayers }));
            }}
          >
            <input placeholder="Room name" value={name}
              onChange={(e) => setName(e.target.value)} required maxLength={30} />
            <select value={mode} onChange={(e) => setMode(e.target.value as RoomMode)}>
              {ROOM_MODES.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <label>
              Max players
              <input type="number" min={MIN_PLAYERS} max={MAX_PLAYERS} value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))} />
            </label>
            <button type="submit" disabled={busy}>Create</button>
          </form>
        </section>

        <section className="box lobby-box">
          <h2>Join a room</h2>
          <form
            className="form-col"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => joinRoom(uid, code));
            }}
          >
            <input placeholder="Room code" value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
              maxLength={4} required />
            <button type="submit" disabled={busy}>Join</button>
          </form>
        </section>
      </div>

      {error && <div className="box error">{error}</div>}
    </div>
  );
}