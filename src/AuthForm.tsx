import { useState } from "react";
import { signUp, logIn } from "./auth";

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "signup") await signUp(email, password, username);
      else await logIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{mode === "signup" ? "Create account" : "Log in"}</h2>
      {mode === "signup" && (
        <input placeholder="Username" value={username}
          onChange={(e) => setUsername(e.target.value)} required />
      )}
      <input type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password (6+ characters)" value={password}
        onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      <button type="submit">{mode === "signup" ? "Sign up" : "Log in"}</button>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <p>
        <button type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
          {mode === "signup" ? "Have an account? Log in" : "Need an account? Sign up"}
        </button>
      </p>
    </form>
  );
}