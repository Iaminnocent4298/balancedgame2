import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const USERNAME_RE = /^[A-Za-z0-9_]{3,16}$/;

export async function signUp(email: string, password: string, username: string) {
  username = username.trim();
  if (!USERNAME_RE.test(username)) {
    throw new Error("Username must be 3-16 characters: letters, numbers, or underscores.");
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await runTransaction(db, async (tx) => {
      const nameRef = doc(db, "usernames", username.toLowerCase());
      if ((await tx.get(nameRef)).exists()) throw new Error("That username is taken.");
      tx.set(nameRef, { uid: cred.user.uid });
      tx.set(doc(db, "players", cred.user.uid), {
        name: username,
        createdAt: serverTimestamp(),
      });
    });
    await updateProfile(cred.user, { displayName: username });
  } catch (err) {
    await cred.user.delete(); // don't leave an account with no username
    throw err;
  }
}

export const logIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);

export const watchAuth = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);