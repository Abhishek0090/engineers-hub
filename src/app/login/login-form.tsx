"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const DEMO_ACCOUNTS = [
  { username: "abhishek", password: "hub@2026", label: "Abhishek (admin)" },
  { username: "demo", password: "demo1234", label: "Demo learner" },
];

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        setBusy(false);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Could not reach the server");
      setBusy(false);
    }
  }

  return (
    <>
      <form className="card stack" onSubmit={onSubmit} noValidate>
        {error ? (
          <div className="alert alert-bad" role="alert">
            {error}
          </div>
        ) : null}
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input id="username" className="input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-block btn-lg" disabled={busy || !username || !password}>
          {busy ? "Logging in..." : "Log in"}
        </button>
      </form>
      <div className="card stack" style={{ gap: 10 }}>
        <p style={{ fontWeight: 600 }}>Static accounts (until the database login is set up)</p>
        {DEMO_ACCOUNTS.map((a) => (
          <button
            key={a.username}
            type="button"
            className="chip"
            style={{ justifyContent: "space-between", width: "100%", padding: "8px 14px" }}
            onClick={() => {
              setUsername(a.username);
              setPassword(a.password);
            }}
          >
            <span>{a.label}</span>
            <code>
              {a.username} / {a.password}
            </code>
          </button>
        ))}
      </div>
    </>
  );
}
