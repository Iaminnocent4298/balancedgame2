import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

// True if this account has a document in the "admins" collection
export function subscribeToAdmin(uid: string, onChange: (isAdmin: boolean) => void) {
  return onSnapshot(
    doc(db, "admins", uid),
    (snap) => onChange(snap.exists()),
    () => onChange(false)
  );
}