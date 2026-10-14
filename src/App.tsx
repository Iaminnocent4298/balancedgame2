import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { watchAuth, logOut } from "./auth";
import AuthForm from "./AuthForm";
import RoomLobby from "./RoomLobby";
import RoomView from "./RoomView";

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
  if (user === null) return <AuthForm />;
  if (player === undefined) return <p>Loading...</p>;

  return (
    <div>
      <p>
        Welcome, {player.name ?? "..."}! <button onClick={logOut}>Log out</button>
      </p>
      {player.roomId ? (
        <RoomView uid={user.uid} roomId={player.roomId} />
      ) : (
        <RoomLobby uid={user.uid} />
      )}
    </div>
  );
}