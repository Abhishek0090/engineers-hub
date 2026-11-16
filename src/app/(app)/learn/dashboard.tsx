"use client";

import Link from "next/link";
import { useState } from "react";

import { FilledIcon, Icon } from "@/components/icons";
import { useProgress } from "@/components/progress-provider";
import { AREAS, GOAL_ICONS, goalProgram, levelLabel, programConfig, programOfId, PROGRAMS } from "@/lib/catalog";
import { currentStreak, dayKey, levelFromXp, MASTERY_SCORE, trackStats } from "@/lib/progress";
import type { Area, Goal, TrackSummary } from "@/lib/types";

const tc = (color: string) => ({ ["--tc" as string]: color });


function GoalPicker({ goals, current, onPick }: { goals: Goal[]; current: string | null; onPick: (g: Goal) => void }) {
  const groups = PROGRAMS.map((p) => ({ ...p, goals: goals.filter((g) => goalProgram(g) === p.id) })).filter((p) => p.goals.length);
  return (
    <div className="stack" style={{ gap: 28 }}>
      {groups.map((p) => (
        <section key={p.id} className="stack" style={{ gap: 12 }}>
          {groups.length > 1 ? (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{p.label}</h2>
              <p className="faint" style={{ fontSize: 14, fontWeight: 600 }}>{p.blurb}</p>
            </div>
          ) : null}
          <GoalGrid goals={p.goals} current={current} onPick={onPick} />
        </section>
      ))}
    </div>
  );
}

function GoalGrid({ goals, current, onPick }: { goals: Goal[]; current: string | null; onPick: (g: Goal) => void }) {
  return (
    <div className="grid grid-3">
      {goals.map((g) => (
        <button key={g.id} type="button" className="card card-link goal-card" aria-pressed={current === g.id} onClick={() => onPick(g)}>
          <span className="feature-icon">
            <Icon name={GOAL_ICONS[g.icon] ?? "target"} size={24} />
          </span>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>{g.title}</h3>
          <p className="muted" style={{ marginTop: 4, fontSize: 14 }}>{g.tagline}</p>
          <p className="faint" style={{ marginTop: 10, fontSize: 13, fontWeight: 700 }}>
            {g.trackIds.length} tracks, {g.dailyGoalXp} XP a day
          </p>
        </button>
      ))}
    </div>
  );
}

function WeekChart({ history }: { history: Record<string, number> }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: dayKey(d), label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2), today: i === 6 };
  });
  const max = Math.max(20, ...days.map((d) => history[d.key] ?? 0));
  return (
    <div className="week" role="img" aria-label="XP earned over the last 7 days">
      {days.map((d) => {
        const v = history[d.key] ?? 0;
        return (
          <div key={d.key} className={`week-col${d.today ? " today" : ""}`}>
            <span>{v || ""}</span>
            <div className={`week-bar${v ? "" : " zero"}`} style={{ height: `${Math.max(4, (v / max) * 80)}px` }} />
            <span>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Dashboard({ tracks, goals, firstName }: { tracks: TrackSummary[]; goals: Goal[]; firstName: string }) {
  const { progress, update, ready } = useProgress();
  const [changingGoal, setChangingGoal] = useState(false);
  const [areaFilter, setAreaFilter] = useState<Area | "all">("all");

  const goal = goals.find((g) => g.id === progress.goalId) ?? null;
  const program = goal ? goalProgram(goal) : programConfig(null).id;
  const terms = programConfig(program).terms;
  const programTracks = tracks.filter((t) => t.program === program);
  const byId = new Map(tracks.map((t) => [t.id, t]));
  const goalTracks = goal ? goal.trackIds.map((id) => byId.get(id)).filter((t): t is TrackSummary => !!t) : [];

  const continueWith = (() => {
    for (const t of goal ? goalTracks : programTracks) {
      const s = trackStats(t, progress);
      if (s.next) return { track: t, chapter: s.next };
    }
    return null;
  })();

  const pickGoal = (g: Goal) => {
    update((p) => ({ ...p, goalId: g.id, program: goalProgram(g), dailyGoalXp: g.dailyGoalXp, updatedAt: new Date().toISOString() }));
    setChangingGoal(false);
    setAreaFilter("all");
  };

  const programMistakes = progress.mistakes.filter((id) => programOfId(id) === program).length;
  const today = progress.history[dayKey()] ?? 0;
  const dailyPct = Math.min(100, Math.round((today / progress.dailyGoalXp) * 100));
  const streak = currentStreak(progress);
  const lvl = levelFromXp(progress.xp);
  const programChapters = new Set(programTracks.flatMap((t) => t.chapters.map((c) => c.id)));
  const mastered = Object.entries(progress.chapters).filter(
    ([id, c]) => programChapters.has(id) && c.attempts > 0 && c.bestScore >= MASTERY_SCORE,
  ).length;
  const totalChapters = programChapters.size;
  const shownTracks = programTracks.filter((t) => areaFilter === "all" || t.area === areaFilter);

  if (!ready) return <div className="container page" />;

  if (!goal || changingGoal) {
    return (
      <div className="container page stack" style={{ gap: 24 }}>
        <div>
          <span className="eyebrow">{goal ? "Change goal" : `Hi ${firstName}`}</span>
          <h1 className="page-title" style={{ marginTop: 6 }}>What are you preparing for?</h1>
          <p className="muted" style={{ marginTop: 6 }}>Pick a goal. It sets your path and daily XP target. You can change it any time.</p>
        </div>
        <GoalPicker goals={goals} current={progress.goalId} onPick={pickGoal} />
        {goal ? (
          <div>
            <button type="button" className="btn btn-ghost" onClick={() => setChangingGoal(false)}>Cancel</button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="layout-2">
        <div className="stack" style={{ gap: 24 }}>
          <div className="row wrap" style={{ justifyContent: "space-between" }}>
            <div>
              <span className="eyebrow">Goal: {goal.title}</span>
              <h1 className="page-title" style={{ marginTop: 4 }}>
                {today >= progress.dailyGoalXp ? `Daily goal done, ${firstName}!` : `Keep going, ${firstName}`}
              </h1>
            </div>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setChangingGoal(true)}>Change goal</button>
          </div>

          <div className="stat-tiles">
            <div className="tile">
              <FilledIcon name="flame" size={30} style={{ color: streak ? "var(--flame)" : "var(--text-3)" }} />
              <div><b>{streak}</b><span>Day streak</span></div>
            </div>
            <div className="tile">
              <FilledIcon name="bolt" size={30} style={{ color: "var(--gold)" }} />
              <div><b>{progress.xp.toLocaleString("en-US")}</b><span>Total XP, level {lvl.level}</span></div>
            </div>
            <div className="tile">
              <div className="ring" style={{ ["--p" as string]: dailyPct }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{dailyPct}%</span>
              </div>
              <div><b>{today}/{progress.dailyGoalXp}</b><span>XP today</span></div>
            </div>
            <div className="tile">
              <Icon name="trophy" size={30} style={{ color: "var(--ok)" }} />
              <div><b>{mastered}/{totalChapters}</b><span>Chapters mastered</span></div>
            </div>
          </div>

          {continueWith ? (
            <div className="continue-card" style={tc(continueWith.track.color)}>
              <div className="row wrap" style={{ gap: 8 }}>
                <span className="badge">{continueWith.track.title}</span>
                <span className="badge">{levelLabel(continueWith.chapter.level)}</span>
                <span className="badge">{continueWith.chapter.estMinutes} min</span>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 12 }}>{continueWith.chapter.title}</h2>
              <p style={{ opacity: 0.9, marginTop: 6, maxWidth: 560 }}>{continueWith.chapter.summary}</p>
              <div className="row wrap" style={{ marginTop: 18 }}>
                <Link href={`/learn/${continueWith.track.id}/${continueWith.chapter.id}`} className="btn btn-accent">
                  <Icon name="book" size={18} /> Study
                </Link>
                <Link href={`/learn/${continueWith.track.id}/${continueWith.chapter.id}/practice`} className="btn btn-ghost">
                  <Icon name="bolt" size={18} /> Practice
                </Link>
              </div>
            </div>
          ) : goalTracks.length === 0 ? (
            <div className="card">
              <h2 style={{ fontWeight: 700 }}>Content for this goal is on its way.</h2>
              <p className="muted">None of its tracks are published yet. Pick another goal for now; your progress stays.</p>
            </div>
          ) : (
            <div className="card">
              <h2 style={{ fontWeight: 700 }}>Every chapter in this goal is mastered.</h2>
              <p className="muted">{terms.doneText}</p>
            </div>
          )}

          <section className="stack" style={{ gap: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Your path</h2>
            {goalTracks.map((t, i) => {
              const s = trackStats(t, progress);
              return (
                <Link key={t.id} href={`/learn/${t.id}`} className="card card-link" style={{ padding: 16 }}>
                  <div className="track-row">
                    <span className="faint" style={{ width: 22, fontWeight: 700, textAlign: "right" }}>{i + 1}</span>
                    <span className="track-badge" style={tc(t.color)}>{t.icon}</span>
                    <div className="grow">
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{t.title}</h3>
                        <span className="faint" style={{ fontSize: 13, fontWeight: 600 }}>{s.mastered}/{s.total}</span>
                      </div>
                      <div className="bar" style={{ marginTop: 8 }}>
                        <span style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                    <Icon name="chevronRight" className="faint" />
                  </div>
                </Link>
              );
            })}
          </section>

          <section className="stack" style={{ gap: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>All tracks</h2>
            <div className="chip-row" role="group" aria-label="Filter by area">
              <button type="button" className="chip" aria-pressed={areaFilter === "all"} onClick={() => setAreaFilter("all")}>All</button>
              {AREAS.filter((a) => programTracks.some((t) => t.area === a.id)).map((a) => (
                <button key={a.id} type="button" className="chip" aria-pressed={areaFilter === a.id} onClick={() => setAreaFilter(a.id)}>
                  {a.label}
                </button>
              ))}
            </div>
            <div className="grid grid-auto">
              {shownTracks.map((t) => {
                const s = trackStats(t, progress);
                return (
                  <Link key={t.id} href={`/learn/${t.id}`} className="card card-link" style={{ padding: 16 }}>
                    <div className="track-row">
                      <span className="track-badge" style={tc(t.color)}>{t.icon}</span>
                      <div className="grow">
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{t.title}</h3>
                        <p className="faint" style={{ fontSize: 12, fontWeight: 700 }}>{t.chapters.length} chapters, {t.questionCount} questions</p>
                      </div>
                    </div>
                    <div className="bar" style={{ marginTop: 12, height: 8 }}>
                      <span style={{ width: `${s.pct}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="stack">
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>This week</h3>
            <WeekChart history={progress.history} />
          </div>
          <div className="card stack" style={{ gap: 10 }}>
            <h3 style={{ fontWeight: 700 }}>Level {lvl.level}</h3>
            <div className="bar" style={{ ["--bc" as string]: "var(--gold)" }}>
              <span style={{ width: `${Math.round((lvl.into / lvl.span) * 100)}%` }} />
            </div>
            <p className="faint" style={{ fontSize: 13, fontWeight: 700 }}>{lvl.span - lvl.into} XP to level {lvl.level + 1}</p>
          </div>
          <Link href="/review" className="card card-link row">
            <Icon name="refresh" size={26} style={{ color: programMistakes ? "var(--bad)" : "var(--text-3)" }} />
            <div className="grow">
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>Review mistakes</h3>
              <p className="faint" style={{ fontSize: 13, fontWeight: 700 }}>{programMistakes} questions waiting</p>
            </div>
          </Link>
          <Link href="/interview" className="card card-link row">
            <Icon name="mic" size={26} style={{ color: "var(--brand)" }} />
            <div className="grow">
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{terms.bank}</h3>
              <p className="faint" style={{ fontSize: 13, fontWeight: 700 }}>{terms.bankHint}</p>
            </div>
          </Link>
        </aside>
      </div>
    </div>
  );
}
