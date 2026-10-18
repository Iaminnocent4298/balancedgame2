import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./firebaseAuth";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 16;
const USERNAME_RE = new RegExp(`^[A-Za-z0-9_]{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}$`);

export async function signUp(email: string, password: string, username: string) {
  username = username.trim();
  if (!USERNAME_RE.test(username)) {
    throw new Error(
      `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters: letters, numbers, or underscores.`
    );
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try {
    const [{ doc, runTransaction, serverTimestamp }, { db }] = await Promise.all([
      import("firebase/firestore"),
      import("./firebase"),
    ]);
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