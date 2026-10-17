import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { watchAuth, logOut } from "./auth";
import { subscribeToAdmin } from "./admin";
import AdminPanel from "./AdminPanel";
import AuthForm from "./AuthForm";
import RoomLobby from "./RoomLobby";
import RoomView from "./RoomView";
import SpectateView from "./SpectateView";
import RoomDataProvider from "./RoomDataProvider";

const BANNER = `${import.meta.env.BASE_URL}banner.png`;
const LOGO = `${import.meta.env.BASE_URL}logo.png`;

type PlayerData = { name: string | null; roomId: string | null };

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [player, setPlayer] = useState<PlayerData | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [spectating, setSpectating] = useState<string | null>(null); // a room code, or null

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

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setSpectating(null);
      return;
    }
    return subscribeToAdmin(user.uid, setIsAdmin);
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
  // Admins can watch any room, but only from the lobby (not while playing in one)
  const spectatingId = isAdmin && !inRoom ? spectating : null;
  const inRoomView = inRoom || spectatingId !== null;

  return (
    <div className="app">
      {/* Welcome bar: logo on the left (small banner in a room), user on the right */}
      <div className="box topbar">
        <img
          className="topbar-img"
          src={inRoomView ? BANNER : LOGO}
          alt={inRoomView ? "Balanced Game" : "Balanced Game logo"}
        />
        <div className="topbar-user">
          <span>Welcome, {player.name ?? "..."}!</span>
          {isAdmin && <span className="admin-badge">Admin</span>}
          <button onClick={logOut}>Log out</button>
        </div>
      </div>

      {/* Big banner on every page except inside a room */}
      {!inRoomView && <img className="banner" src={BANNER} alt="Balanced Game" />}

      {inRoom ? (
        <RoomDataProvider roomId={player.roomId!} uid={user.uid}>
          <RoomView uid={user.uid} roomId={player.roomId!} />
        </RoomDataProvider>
      ) : spectatingId ? (
        <RoomDataProvider roomId={spectatingId} uid={user.uid}>
          <SpectateView uid={user.uid} onExit={() => setSpectating(null)} />
        </RoomDataProvider>
      ) : (
        <RoomLobby
          uid={user.uid}
          extra={isAdmin ? <AdminPanel onSpectate={setSpectating} /> : undefined}
        />
      )}
    </div>
  );
}