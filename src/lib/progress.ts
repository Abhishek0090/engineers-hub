// Pure progress logic: used by the browser (ProgressProvider) and by the progress API.
import type { ChapterProgress, Progress, TrackSummary } from "@/lib/types";

export const MASTERY_SCORE = 80;
export const XP_CORRECT = 10;
export const XP_PARTIAL = 5;
export const XP_STUDY = 5;

export function emptyProgress(): Progress {
  return {
    version: 1,
    xp: 0,
    goalId: null,
    dailyGoalXp: 30,
    streak: { count: 0, lastDay: null, best: 0 },
    history: {},
    chapters: {},
    mistakes: [],
    practiced: [],
    updatedAt: new Date(0).toISOString(),
  };
}

export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysBetween(a: string, b: string): number {
  const toUtc = (k: string) => {
    const [y, m, d] = k.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

/** Streak as it stands today: a streak whose last day is before yesterday is broken. */
export function currentStreak(p: Progress, today = dayKey()): number {
  if (!p.streak.lastDay) return 0;
  return daysBetween(p.streak.lastDay, today) <= 1 ? p.streak.count : 0;
}

export function addXp(p: Progress, amount: number, now = new Date()): Progress {
  if (amount <= 0) return p;
  const today = dayKey(now);
  let { count, lastDay, best } = p.streak;
  if (lastDay !== today) {
    count = lastDay && daysBetween(lastDay, today) === 1 ? count + 1 : 1;
    lastDay = today;
    best = Math.max(best, count);
  }
  return {
    ...p,
    xp: p.xp + amount,
    streak: { count, lastDay, best },
    history: { ...p.history, [today]: (p.history[today] ?? 0) + amount },
    updatedAt: now.toISOString(),
  };
}

export interface SessionResult {
  chapterId?: string;
  score: number; // 0-100
  xp: number;
  wrongIds: string[];
  rightIds: string[];
}

export function recordSession(p: Progress, r: SessionResult): Progress {
  let next = addXp(p, r.xp);
  const mistakes = new Set(next.mistakes);
  r.rightIds.forEach((id) => mistakes.delete(id));
  r.wrongIds.forEach((id) => mistakes.add(id));
  next = { ...next, mistakes: [...mistakes], updatedAt: new Date().toISOString() };
  if (r.chapterId) {
    const prev: ChapterProgress | undefined = next.chapters[r.chapterId];
    next.chapters = {
      ...next.chapters,
      [r.chapterId]: {
        bestScore: Math.max(prev?.bestScore ?? 0, r.score),
        attempts: (prev?.attempts ?? 0) + 1,
        completedAt: new Date().toISOString(),
        studied: prev?.studied ?? true,
      },
    };
  }
  return next;
}

export function markStudied(p: Progress, chapterId: string): Progress {
  const prev = p.chapters[chapterId];
  if (prev?.studied) return p;
  const next = addXp(p, XP_STUDY);
  return {
    ...next,
    chapters: {
      ...next.chapters,
      [chapterId]: { bestScore: prev?.bestScore ?? 0, attempts: prev?.attempts ?? 0, completedAt: prev?.completedAt ?? "", studied: true },
    },
  };
}

export type ChapterState = "new" | "studied" | "practiced" | "mastered";
export function chapterState(p: Progress, chapterId: string): ChapterState {
  const c = p.chapters[chapterId];
  if (!c) return "new";
  if (c.attempts > 0 && c.bestScore >= MASTERY_SCORE) return "mastered";
  if (c.attempts > 0) return "practiced";
  return c.studied ? "studied" : "new";
}

/** Accepts anything (e.g. a request body) and returns a well-formed Progress. */
export function sanitizeProgress(input: unknown): Progress {
  const base = emptyProgress();
  if (!input || typeof input !== "object") return base;
  const o = input as Record<string, unknown>;
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : d);
  const strArr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 5000) : []);
  const streak = (o.streak ?? {}) as Record<string, unknown>;
  const history: Record<string, number> = {};
  if (o.history && typeof o.history === "object")
    for (const [k, v] of Object.entries(o.history)) if (/^\d{4}-\d{2}-\d{2}$/.test(k)) history[k] = num(v, 0);
  const chapters: Record<string, ChapterProgress> = {};
  if (o.chapters && typeof o.chapters === "object")
    for (const [k, v] of Object.entries(o.chapters as Record<string, Record<string, unknown>>)) {
      if (!v || typeof v !== "object") continue;
      chapters[k] = {
        bestScore: Math.min(100, num(v.bestScore, 0)),
        attempts: num(v.attempts, 0),
        completedAt: typeof v.completedAt === "string" ? v.completedAt : "",
        studied: v.studied === true,
      };
    }
  return {
    version: 1,
    xp: num(o.xp, 0),
    goalId: typeof o.goalId === "string" ? o.goalId : null,
    dailyGoalXp: Math.min(500, Math.max(10, num(o.dailyGoalXp, base.dailyGoalXp))),
    streak: {
      count: num(streak.count, 0),
      lastDay: typeof streak.lastDay === "string" ? streak.lastDay : null,
      best: num(streak.best, 0),
    },
    history,
    chapters,
    mistakes: strArr(o.mistakes),
    practiced: strArr(o.practiced),
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : base.updatedAt,
  };
}

export function levelFromXp(xp: number): { level: number; into: number; span: number } {
  // Each level needs 50 more XP than the previous one: 100, 150, 200, ...
  let level = 1;
  let need = 100;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    level++;
    need += 50;
  }
  return { level, into: rest, span: need };
}

export function trackStats(t: TrackSummary, p: Progress) {
  const states = t.chapters.map((c) => chapterState(p, c.id));
  const mastered = states.filter((s) => s === "mastered").length;
  const touched = states.filter((s) => s !== "new").length;
  const next = t.chapters.find((c) => chapterState(p, c.id) !== "mastered") ?? null;
  return { mastered, touched, total: t.chapters.length, next, pct: t.chapters.length ? Math.round((mastered / t.chapters.length) * 100) : 0 };
}
