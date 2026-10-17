import { useState } from "react";
import { logIn, signUp, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from "./auth";

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
    <div className="center-page">
      <form className="box form-col auth-box" onSubmit={handleSubmit}>
        <h2>{mode === "signup" ? "Create account" : "Log in"}</h2>
        {mode === "signup" && (
          <input placeholder="Username" value={username}
            onChange={(e) => setUsername(e.target.value)} required
            minLength={USERNAME_MIN_LENGTH} maxLength={USERNAME_MAX_LENGTH} />
        )}
        <input type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password (6+ characters)" value={password}
          onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <button type="submit">{mode === "signup" ? "Sign up" : "Log in"}</button>
        {error && <p className="error">{error}</p>}
        <button type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
          {mode === "signup" ? "Have an account? Log in" : "Need an account? Sign up"}
        </button>
      </form>
    </div>
  );
}