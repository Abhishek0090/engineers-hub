"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { FilledIcon, Icon } from "@/components/icons";
import { useProgress } from "@/components/progress-provider";
import { programConfig, progressProgram } from "@/lib/catalog";
import { currentStreak, dayKey, levelFromXp, trackStats } from "@/lib/progress";
import type { Goal, TrackSummary } from "@/lib/types";


const DAILY_OPTIONS = [10, 20, 30, 50, 80, 120];

function Heatmap({ history }: { history: Record<string, number> }) {
  const weeks = 20;
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (weeks * 7 - 1) - end.getDay());
  const cells: { key: string; v: number }[] = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = dayKey(d);
    cells.push({ key, v: history[key] ?? 0 });
  }
  const level = (v: number) => (v === 0 ? 0 : v < 20 ? 1 : v < 50 ? 2 : v < 100 ? 3 : 4);
  return (
    <div className="heat" role="img" aria-label="Daily XP over the last 20 weeks">
      {cells.map((c) => (
        <span key={c.key} data-l={level(c.v)} title={`${c.key}: ${c.v} XP`} />
      ))}
    </div>
  );
}

export function ProfileView({
  user,
  tracks,
  goals,
  dataSource,
}: {
  user: { name: string; username: string };
  tracks: TrackSummary[];
  goals: Goal[];
  dataSource: string;
}) {
  const router = useRouter();
  const { progress, update, reset, synced } = useProgress();
  const lvl = levelFromXp(progress.xp);
  const goal = goals.find((g) => g.id === progress.goalId);
  const program = programConfig(progressProgram(progress));
  const programTracks = tracks.filter((t) => t.program === program.id);
  const activeDays = Object.values(progress.history).filter((v) => v > 0).length;
  const questionsDone = Object.values(progress.chapters).reduce((n, c) => n + c.attempts, 0);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="container page">
      <div className="layout-2">
        <div className="stack" style={{ gap: 24 }}>
          <div className="row" style={{ gap: 16 }}>
            <span className="track-badge lg" style={{ ["--tc" as string]: "var(--brand)", borderRadius: "50%" }}>
              {user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </span>
            <div>
              <h1 className="page-title">{user.name}</h1>
              <p className="faint" style={{ fontWeight: 700 }}>@{user.username} - level {lvl.level}</p>
            </div>
          </div>

          <div className="stat-tiles">
            <div className="tile"><FilledIcon name="flame" size={28} style={{ color: "var(--flame)" }} /><div><b>{currentStreak(progress)}</b><span>Current streak</span></div></div>
            <div className="tile"><FilledIcon name="star" size={28} style={{ color: "var(--gold)" }} /><div><b>{progress.streak.best}</b><span>Best streak</span></div></div>
            <div className="tile"><FilledIcon name="bolt" size={28} style={{ color: "var(--gold)" }} /><div><b>{progress.xp.toLocaleString("en-US")}</b><span>Total XP</span></div></div>
            <div className="tile"><Icon name="clock" size={28} style={{ color: "var(--info)" }} /><div><b>{activeDays}</b><span>Active days</span></div></div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Activity</h2>
            <Heatmap history={progress.history} />
          </div>

          <div className="card stack" style={{ gap: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Track progress: {program.short}</h2>
            {programTracks.map((t) => {
              const s = trackStats(t, progress);
              return (
                <Link key={t.id} href={`/learn/${t.id}`} className="track-row">
                  <span className="track-badge sm" style={{ ["--tc" as string]: t.color }}>{t.icon}</span>
                  <div className="grow">
                    <div className="row" style={{ justifyContent: "space-between", fontSize: 14, fontWeight: 600 }}>
                      <span>{t.title}</span>
                      <span className="faint">{s.mastered}/{s.total}</span>
                    </div>
                    <div className="bar" style={{ height: 8, marginTop: 6 }}><span style={{ width: `${s.pct}%` }} /></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="stack">
          <div className="card stack" style={{ gap: 12 }}>
            <h3 style={{ fontWeight: 700 }}>Settings</h3>
            <div>
              <p className="label">Goal</p>
              <p style={{ fontWeight: 700 }}>{goal?.title ?? "Not set"}</p>
              <Link href="/learn" className="link" style={{ fontSize: 14 }}>Change on the Learn page</Link>
            </div>
            <div>
              <label className="label" htmlFor="daily">Daily XP goal</label>
              <select
                id="daily"
                className="input"
                value={progress.dailyGoalXp}
                onChange={(e) => update((p) => ({ ...p, dailyGoalXp: Number(e.target.value), updatedAt: new Date().toISOString() }))}
              >
                {DAILY_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o} XP a day</option>
                ))}
              </select>
            </div>
          </div>
          <div className="card stack" style={{ gap: 10 }}>
            <h3 style={{ fontWeight: 700 }}>Data</h3>
            <dl className="kv">
              <dt>Source</dt>
              <dd>{dataSource === "mongo" ? "MongoDB" : "Static JSON"}</dd>
              <dt>Progress</dt>
              <dd>{synced ? "Saved to your account" : "Saved in this browser"}</dd>
              <dt>Sessions</dt>
              <dd>{questionsDone}</dd>
              <dt>Practiced</dt>
              <dd>{progress.practiced.length} written questions</dd>
            </dl>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                if (window.confirm("Reset all progress, XP and streak? This cannot be undone.")) reset();
              }}
            >
              Reset progress
            </button>
          </div>
          <button type="button" className="btn btn-bad" onClick={logout}>
            <Icon name="logout" size={18} /> Log out
          </button>
        </aside>
      </div>
    </div>
  );
}
