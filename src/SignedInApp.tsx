import { lazy, Suspense, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { logOut } from "./auth";
import { subscribeToAdmin } from "./admin";

const AdminPanel = lazy(() => import("./AdminPanel"));
const RoomLobby = lazy(() => import("./RoomLobby"));
const RoomView = lazy(() => import("./RoomView"));
const SpectateView = lazy(() => import("./SpectateView"));
const RoomDataProvider = lazy(() => import("./RoomDataProvider"));

type PlayerData = { name: string | null; roomId: string | null };
type StoredPlayer = { uid: string; value: PlayerData };
type StoredAdmin = { uid: string; value: boolean };

type Props = {
  user: User;
  banner: string;
  logo: string;
  splashText: string;
};

export default function SignedInApp({ user, banner, logo, splashText }: Props) {
  const [storedPlayer, setStoredPlayer] = useState<StoredPlayer>();
  const [storedAdmin, setStoredAdmin] = useState<StoredAdmin>();
  const [spectating, setSpectating] = useState<string | null>(null);

  useEffect(
    () => onSnapshot(doc(db, "players", user.uid), (snap) => {
      const data = snap.data();
      setStoredPlayer({
        uid: user.uid,
        value: { name: data?.name ?? null, roomId: data?.roomId ?? null },
      });
    }),
    [user.uid]
  );

  useEffect(
    () => subscribeToAdmin(user.uid, (value) => setStoredAdmin({ uid: user.uid, value })),
    [user.uid]
  );

  const player = storedPlayer?.uid === user.uid ? storedPlayer.value : undefined;
  const isAdmin = storedAdmin?.uid === user.uid && storedAdmin.value;
  if (player === undefined) return <p>Loading...</p>;

  const inRoom = Boolean(player.roomId);
  const spectatingId = isAdmin && !inRoom ? spectating : null;
  const inRoomView = inRoom || spectatingId !== null;

  return (
    <>
      <div className="box topbar">
        <img
          className="topbar-img"
          src={inRoomView ? banner : logo}
          alt={inRoomView ? "Balanced Game" : "Balanced Game logo"}
        />
        <div className="topbar-user">
          <span>Welcome, {player.name ?? "..."}!</span>
          {isAdmin && <span className="admin-badge">Admin</span>}
          <button onClick={logOut}>Log out</button>
        </div>
      </div>

      {!inRoomView && <img className="banner" src={banner} alt="Balanced Game" />}
      {!inRoomView && <div className="splash-text">{splashText}</div>}

      <Suspense fallback={<p>Loading...</p>}>
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
      </Suspense>
    </>
  );
}
