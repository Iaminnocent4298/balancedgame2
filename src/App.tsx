import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { watchAuth, logOut } from "./auth";
import AuthForm from "./AuthForm";
import RoomLobby from "./RoomLobby";
import RoomView from "./RoomView";

const BANNER = `${import.meta.env.BASE_URL}banner.png`;
const LOGO = `${import.meta.env.BASE_URL}logo.png`;

type PlayerData = { name: string | null; roomId: string | null };

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [player, setPlayer] = useState<PlayerData | undefined>(undefined);

  useEffect(() => watchAuth(setUser), []);

  useEffect(() => {
    if (!user) {
      setPlayer(undefined);
      return;
    }
    return onSnapshot(doc(db, "players", user.uid), (snap) => {
      const data = snap.data();
      setPlayer({ name: data?.name ?? null, roomId: data?.roomId ?? null });
    });
  }, [user]);

  if (user === undefined) return <p>Loading...</p>;

  // Logged out: banner and login form, no welcome bar
  if (user === null) {
    return (
      <div className="app">
        <img className="banner" src={BANNER} alt="Balanced Game" />
        <AuthForm />
      </div>
    );
  }

  if (player === undefined) return <p>Loading...</p>;

  const inRoom = Boolean(player.roomId);

  return (
    <div className="app">
      {/* Welcome bar: logo on the left (small banner in a room), user on the right */}
      <div className="box topbar">
        <img
          className="topbar-img"
          src={inRoom ? BANNER : LOGO}
          alt={inRoom ? "Balanced Game" : "Balanced Game logo"}
        />
        <div className="topbar-user">
          <span>Welcome, {player.name ?? "..."}!</span>
          <button onClick={logOut}>Log out</button>
        </div>
      </div>

      {/* Big banner on every page except inside a room */}
      {!inRoom && <img className="banner" src={BANNER} alt="Balanced Game" />}

      {inRoom ? (
        <RoomView uid={user.uid} roomId={player.roomId!} />
      ) : (
        <RoomLobby uid={user.uid} />
      )}
    </div>
  );
}