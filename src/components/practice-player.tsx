"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { recordSession, XP_CORRECT, XP_PARTIAL } from "@/lib/progress";
import { programConfig } from "@/lib/catalog";
import { isSelfRated, type Question } from "@/lib/types";

import { CodeBlock } from "./code-block";
import { FilledIcon, Icon } from "./icons";
import { useProgress } from "./progress-provider";
import { Inline, RichText } from "./rich-text";

type Outcome = "right" | "wrong" | "partial";
type Mode = "all" | "quick" | "graded" | "interview";

export interface PracticeItem {
  question: Question;
  /** Shown above the prompt in mixed sessions (review, mock interview). */
  context?: string;
}

interface Props {
  items: PracticeItem[];
  title: string;
  subtitle?: string;
  exitHref: string;
  chapterId?: string;
  next?: { href: string; label: string };
  /** Skip the intro screen and start with all items in the given order. */
  autoStart?: boolean;
}

const TYPE_LABEL: Record<Question["type"], string> = {
  mcq: "Multiple choice",
  truefalse: "True or false",
  multi: "Select all that apply",
  fill: "Fill in the blank",
  interview: "Interview question",
  numeric: "Calculation",
  practical: "Practical problem",
};
/** "interview" questions take their label from the program ("Interview question", "Theory question"). */
const typeLabel = (q: Question) => (q.type === "interview" ? programConfig(q.program).terms.question : TYPE_LABEL[q.type]);

/** Reads "1,25,000", "₹ 1,25,000", "Rs. 500", "(2,000)", "12.5%" as numbers. */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().replace(/^(rs\.?|inr|₹)\s*/i, "").replace(/[,\s₹%]/g, "");
  let sign = 1;
  if (/^\(.*\)$/.test(s)) {
    sign = -1;
    s = s.slice(1, -1);
  }
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  return sign * Number(s);
}
const toleranceOf = (q: { answer: number; tolerance?: number }) => q.tolerance ?? Math.max(0.01, Math.abs(q.answer) * 0.001);
const formatNumber = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 4 });
const PERFECT_BONUS = 10;
const NO_SHUFFLE = /\b(all|none|both|neither) of the above\b|^(a|b) and (b|c)$|^both\b/i;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffles answer options (and remaps the correct indexes) unless order matters. */
function shuffleOptions(q: Question): Question {
  if ((q.type !== "mcq" && q.type !== "multi") || q.options.some((o) => NO_SHUFFLE.test(o.trim()))) return q;
  const order = shuffle(q.options.map((_, i) => i));
  const options = order.map((i) => q.options[i]);
  if (q.type === "mcq") return { ...q, options, answer: order.indexOf(q.answer) };
  return { ...q, options, answers: q.answers.map((a) => order.indexOf(a)) };
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/^[`'"]+|[`'";]+$/g, "")
    .replace(/\(\)$/, "")
    .replace(/\s+/g, " ")
    .trim();

function buildSession(items: PracticeItem[], mode: Mode): PracticeItem[] {
  const graded = items.filter((i) => !isSelfRated(i.question));
  const interview = items.filter((i) => isSelfRated(i.question));
  let picked: PracticeItem[];
  if (mode === "graded") picked = shuffle(graded);
  else if (mode === "interview") picked = shuffle(interview);
  else if (mode === "quick") picked = [...shuffle(graded).slice(0, 8), ...shuffle(interview).slice(0, 2)];
  else picked = [...shuffle(graded), ...shuffle(interview)];
  return picked.map((i) => ({ ...i, question: shuffleOptions(i.question) }));
}

function correctText(q: Question): string {
  switch (q.type) {
    case "mcq":
      return q.options[q.answer];
    case "multi":
      return q.answers.map((a) => q.options[a]).join(", ");
    case "truefalse":
      return q.answer ? "True" : "False";
    case "fill":
      return q.accept[0];
    case "numeric":
      return q.unit === "₹" ? `₹${formatNumber(q.answer)}` : `${formatNumber(q.answer)}${q.unit ? ` ${q.unit}` : ""}`;
    case "interview":
    case "practical":
      return "";
  }
}

export function PracticePlayer({ items, title, subtitle, exitHref, chapterId, next, autoStart }: Props) {
  const { update } = useProgress();
  const [session, setSession] = useState<PracticeItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"answer" | "feedback" | "reveal">("answer");
  const [choice, setChoice] = useState<number | null>(null);
  const [multi, setMulti] = useState<number[]>([]);
  const [tf, setTf] = useState<boolean | null>(null);
  const [fill, setFill] = useState("");
  const [num, setNum] = useState("");
  const [draft, setDraft] = useState("");
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [finished, setFinished] = useState<{ score: number; xp: number; seconds: number } | null>(null);
  const fillRef = useRef<HTMLInputElement>(null);

  const counts = useMemo(() => {
    const interview = items.filter((i) => isSelfRated(i.question)).length;
    const written = programConfig(items[0]?.question.program).terms.written;
    return {
      total: items.length,
      interview,
      graded: items.length - interview,
      written,
      writtenTitle: written[0].toUpperCase() + written.slice(1),
    };
  }, [items]);

  const start = useCallback(
    (mode: Mode) => {
      setSession(autoStart ? items.map((i) => ({ ...i, question: shuffleOptions(i.question) })) : buildSession(items, mode));
      setIndex(0);
      setPhase("answer");
      setOutcomes({});
      setCombo(0);
      setBestCombo(0);
      setFinished(null);
      setStartedAt(Date.now());
    },
    [items, autoStart],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start once on mount; shuffling must not run during SSR
    if (autoStart) start("all");
  }, [autoStart, start]);

  const item = session?.[index];
  const q = item?.question;

  const resetInputs = () => {
    setChoice(null);
    setMulti([]);
    setTf(null);
    setFill("");
    setNum("");
    setDraft("");
  };

  const canCheck =
    !!q &&
    ((q.type === "mcq" && choice !== null) ||
      (q.type === "multi" && multi.length > 0) ||
      (q.type === "truefalse" && tf !== null) ||
      (q.type === "fill" && fill.trim().length > 0) ||
      (q.type === "numeric" && parseNumber(num) !== null) ||
      isSelfRated(q));

  const record = (o: Outcome) => {
    if (!q) return;
    setOutcomes((prev) => ({ ...prev, [q.id]: o }));
    if (o === "right") {
      setCombo((c) => {
        const n = c + 1;
        setBestCombo((b) => Math.max(b, n));
        return n;
      });
    } else setCombo(0);
  };

  const check = () => {
    if (!q || !canCheck || phase !== "answer") return;
    if (isSelfRated(q)) {
      setPhase("reveal");
      return;
    }
    let ok = false;
    if (q.type === "mcq") ok = choice === q.answer;
    if (q.type === "truefalse") ok = tf === q.answer;
    if (q.type === "multi") ok = multi.length === q.answers.length && q.answers.every((a) => multi.includes(a));
    if (q.type === "fill") ok = q.accept.some((a) => normalize(a) === normalize(fill));
    if (q.type === "numeric") {
      const n = parseNumber(num);
      ok = n !== null && Math.abs(n - q.answer) <= toleranceOf(q) + 1e-9;
    }
    record(ok ? "right" : "wrong");
    setPhase("feedback");
  };

  const finish = (all: Record<string, Outcome>) => {
    if (!session) return;
    const values = session.map((i) => all[i.question.id]);
    const right = values.filter((v) => v === "right").length;
    const partial = values.filter((v) => v === "partial").length;
    const score = Math.round(((right + partial * 0.5) / session.length) * 100);
    const xp = right * XP_CORRECT + partial * XP_PARTIAL + (score === 100 ? PERFECT_BONUS : 0);
    const wrongIds = session.filter((i) => all[i.question.id] === "wrong").map((i) => i.question.id);
    const rightIds = session.filter((i) => all[i.question.id] !== "wrong").map((i) => i.question.id);
    update((p) => recordSession(p, { chapterId, score, xp, wrongIds, rightIds }));
    setFinished({ score, xp, seconds: Math.round((Date.now() - startedAt) / 1000) });
  };

  const advance = (latest: Record<string, Outcome> = outcomes) => {
    if (!session) return;
    if (index + 1 >= session.length) {
      finish(latest);
      return;
    }
    setIndex((i) => i + 1);
    setPhase("answer");
    resetInputs();
  };

  const rate = (o: Outcome) => {
    if (!q) return;
    const latest = { ...outcomes, [q.id]: o };
    record(o);
    advance(latest);
  };

  // Keyboard: 1-6 pick an option, Enter checks or continues.
  useEffect(() => {
    if (!q || finished) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "TEXTAREA" || (tag === "INPUT" && e.key !== "Enter");
      if (typing) return;
      if (e.key === "Enter") {
        if (tag === "BUTTON" || tag === "A") return; // let the focused control handle it
        e.preventDefault();
        if (phase === "answer") check();
        else if (phase === "feedback") advance();
        return;
      }
      if (phase !== "answer") return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1) return;
      if (q.type === "mcq" && n <= q.options.length) setChoice(n - 1);
      if (q.type === "multi" && n <= q.options.length) setMulti((m) => (m.includes(n - 1) ? m.filter((x) => x !== n - 1) : [...m, n - 1]));
      if (q.type === "truefalse" && n <= 2) setTf(n === 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if ((q?.type === "fill" || q?.type === "numeric") && phase === "answer") fillRef.current?.focus();
  }, [q, phase]);

  const exit = (e: React.MouseEvent) => {
    if (session && !finished && index > 0 && !window.confirm("Quit this session? Your answers so far will not be saved.")) e.preventDefault();
  };

  // ---------- Intro ----------
  if (!session) {
    if (autoStart) return <div className="player" />;
    return (
      <div className="player">
        <div className="container player-top">
          <Link href={exitHref} className="icon-btn" aria-label="Back">
            <Icon name="x" />
          </Link>
        </div>
        <div className="result">
          <div className="trophy" style={{ color: "var(--brand)" }}>
            <FilledIcon name="bolt" size={56} />
          </div>
          <h1 className="page-title" style={{ marginTop: 12 }}>{title}</h1>
          {subtitle ? <p className="muted" style={{ marginTop: 6 }}>{subtitle}</p> : null}
          <p className="faint" style={{ marginTop: 6, fontWeight: 700 }}>
            {counts.graded} quiz questions, {counts.interview} {counts.written} questions
          </p>
          <div className="stack" style={{ marginTop: 28, gap: 12 }}>
            <button type="button" className="btn btn-lg btn-accent btn-block" onClick={() => start("all")}>
              Full practice ({counts.total})
            </button>
            {counts.total > 10 ? (
              <button type="button" className="btn btn-block" onClick={() => start("quick")}>
                Quick round (10)
              </button>
            ) : null}
            <div className="row" style={{ gap: 12 }}>
              {counts.graded > 0 && counts.interview > 0 ? (
                <button type="button" className="btn btn-ghost grow" onClick={() => start("graded")}>
                  Quiz only
                </button>
              ) : null}
              {counts.interview > 0 ? (
                <button type="button" className="btn btn-ghost grow" onClick={() => start("interview")}>
                  {counts.writtenTitle} only
                </button>
              ) : null}
            </div>
          </div>
          <p className="kbd-hint" style={{ marginTop: 20 }}>Tip: press 1-6 to pick an answer and Enter to check.</p>
        </div>
      </div>
    );
  }

  // ---------- Results ----------
  if (finished) {
    const wrong = session.filter((i) => outcomes[i.question.id] === "wrong");
    const mins = Math.floor(finished.seconds / 60);
    const secs = String(finished.seconds % 60).padStart(2, "0");
    return (
      <div className="player">
        <div className="result">
          <div className="trophy">
            <Icon name="trophy" size={64} />
          </div>
          <h1 className="page-title" style={{ marginTop: 12 }}>
            {finished.score === 100 ? "Perfect session!" : finished.score >= 80 ? "Chapter mastered!" : finished.score >= 50 ? "Good work!" : "Keep practicing"}
          </h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {finished.score >= 80 ? "You know this material." : "Wrong answers are saved to your review queue."}
          </p>
          <div className="result-badges">
            <div className="result-badge" style={{ ["--rc" as string]: "var(--gold)" }}>
              <span>Total XP</span>
              <b className="row" style={{ justifyContent: "center", gap: 4 }}>
                <FilledIcon name="bolt" size={20} style={{ color: "var(--gold)" }} />
                {finished.xp}
              </b>
            </div>
            <div className="result-badge" style={{ ["--rc" as string]: "var(--ok)" }}>
              <span>Score</span>
              <b>{finished.score}%</b>
            </div>
            <div className="result-badge" style={{ ["--rc" as string]: "var(--info)" }}>
              <span>Time</span>
              <b>{mins}:{secs}</b>
            </div>
          </div>
          {bestCombo >= 3 ? (
            <p className="combo" style={{ marginBottom: 20 }}>Best combo: {bestCombo} in a row</p>
          ) : null}
          <div className="stack" style={{ gap: 12 }}>
            {next ? (
              <Link href={next.href} className="btn btn-lg btn-accent btn-block">
                {next.label} <Icon name="arrowRight" size={18} />
              </Link>
            ) : null}
            <div className="row" style={{ gap: 12 }}>
              <button type="button" className="btn btn-ghost grow" onClick={() => (autoStart ? start("all") : setSession(null))}>
                <Icon name="refresh" size={18} /> Again
              </button>
              <Link href={exitHref} className="btn btn-ghost grow">
                Done
              </Link>
            </div>
          </div>
          {wrong.length ? (
            <div style={{ textAlign: "left", marginTop: 36 }} className="stack">
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>To review ({wrong.length})</h2>
              {wrong.map((w) => (
                <div key={w.question.id} className="card" style={{ padding: 16 }}>
                  <p style={{ fontWeight: 600 }}><Inline text={w.question.prompt} /></p>
                  {!isSelfRated(w.question) ? (
                    <p style={{ marginTop: 6, color: "var(--ok)", fontWeight: 700 }}>Answer: <Inline text={correctText(w.question)} /></p>
                  ) : null}
                  {w.question.explanation ? <p className="muted" style={{ marginTop: 6, fontSize: 14 }}><Inline text={w.question.explanation} /></p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (!q || !item) return null;

  // ---------- Question ----------
  const outcome = outcomes[q.id];
  const done = Object.keys(outcomes).length;
  const pct = Math.round((done / session.length) * 100);
  const optClass = (i: number, selected: boolean) => {
    if (phase !== "feedback") return "option";
    const right = q.type === "mcq" ? i === q.answer : q.type === "multi" ? q.answers.includes(i) : false;
    if (right) return "option is-right";
    if (selected) return "option is-wrong";
    return "option";
  };

  return (
    <div className="player">
      <div className="container player-top">
        <Link href={exitHref} className="icon-btn" aria-label="Quit session" onClick={exit}>
          <Icon name="x" />
        </Link>
        <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Session progress">
          <span style={{ width: `${pct}%` }} />
        </div>
        <span className="faint" style={{ fontWeight: 600, fontSize: 14 }}>{index + 1}/{session.length}</span>
      </div>

      <div className="player-body">
        <div className="row wrap" style={{ justifyContent: "space-between" }}>
          <span className="q-type">{typeLabel(q)}</span>
          {combo >= 2 ? <span className="combo">{combo} in a row</span> : null}
        </div>
        {item.context ? <p className="faint" style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{item.context}</p> : null}
        {q.caseBody ? (
          <details className="q-case q-data" open={phase === "answer"}>
            <summary>{q.caseTitle ?? "Case"}</summary>
            <RichText text={q.caseBody} />
          </details>
        ) : null}
        <h1 className="q-prompt"><Inline text={q.prompt} /></h1>
        {q.code ? <CodeBlock source={q.code} /> : null}
        {q.data ? (
          <div className="q-data">
            <RichText text={q.data} />
          </div>
        ) : null}

        {q.type === "mcq" ? (
          <div className="options" role="radiogroup">
            {q.options.map((o, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={choice === i}
                className={optClass(i, choice === i)}
                disabled={phase !== "answer"}
                onClick={() => setChoice(i)}
              >
                <span className="key">{i + 1}</span>
                <span><Inline text={o} /></span>
              </button>
            ))}
          </div>
        ) : null}

        {q.type === "multi" ? (
          <div className="options">
            {q.options.map((o, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={multi.includes(i)}
                className={optClass(i, multi.includes(i))}
                disabled={phase !== "answer"}
                onClick={() => setMulti((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]))}
              >
                <span className="key">{multi.includes(i) ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}</span>
                <span><Inline text={o} /></span>
              </button>
            ))}
          </div>
        ) : null}

        {q.type === "truefalse" ? (
          <div className="options tf" role="radiogroup">
            {[true, false].map((v, i) => {
              const cls =
                phase === "feedback" ? (v === q.answer ? "option is-right" : tf === v ? "option is-wrong" : "option") : "option";
              return (
                <button key={String(v)} type="button" role="radio" aria-checked={tf === v} className={cls} disabled={phase !== "answer"} onClick={() => setTf(v)}>
                  <span className="key">{i + 1}</span> {v ? "True" : "False"}
                </button>
              );
            })}
          </div>
        ) : null}

        {q.type === "fill" ? (
          <div style={{ marginTop: 24 }}>
            <label className="sr-only" htmlFor="fill">Your answer</label>
            <input
              id="fill"
              ref={fillRef}
              className="input"
              style={{ fontFamily: "var(--font-mono)", fontSize: 18 }}
              value={fill}
              disabled={phase !== "answer"}
              autoComplete="off"
              spellCheck={false}
              placeholder="Type your answer"
              onChange={(e) => setFill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  check();
                }
              }}
            />
          </div>
        ) : null}

        {q.type === "numeric" ? (
          <div className="numeric-input">
            <label className="sr-only" htmlFor="num">Your answer</label>
            {q.unit === "₹" ? <span className="unit">₹</span> : null}
            <input
              id="num"
              ref={fillRef}
              className="input"
              style={{ fontFamily: "var(--font-mono)", fontSize: 18 }}
              inputMode="decimal"
              value={num}
              disabled={phase !== "answer"}
              autoComplete="off"
              placeholder="Your answer, e.g. 1,25,000"
              onChange={(e) => setNum(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  check();
                }
              }}
            />
            {q.unit && q.unit !== "₹" ? <span className="unit">{q.unit}</span> : null}
          </div>
        ) : null}

        {isSelfRated(q) ? (
          <div style={{ marginTop: 20 }} className="stack">
            {phase === "answer" ? (
              <>
                <label className="label" htmlFor="draft">
                  {q.type === "practical" ? "Work it out on paper, or note your final figures here (optional)" : "Answer out loud or jot down your points (optional)"}
                </label>
                <textarea
                  id="draft"
                  className="input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={q.type === "practical" ? "Your working and answer..." : "Key points you would mention..."}
                />
              </>
            ) : (
              <>
                {draft.trim() ? (
                  <div className="card" style={{ padding: 14 }}>
                    <p className="label">Your notes</p>
                    <p style={{ whiteSpace: "pre-wrap", fontSize: 15 }}>{draft}</p>
                  </div>
                ) : null}
                <div className="answer-box">
                  <p className="label" style={{ color: "var(--brand)" }}>{q.type === "practical" ? "Model solution" : "Model answer"}</p>
                  <RichText text={q.answer} />
                </div>
                <p className="muted" style={{ fontWeight: 700 }}>How did your answer compare?</p>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className={`player-foot${phase === "feedback" ? (outcome === "right" ? " ok" : " bad") : ""}`}>
        <div className="player-foot-inner">
          {phase === "feedback" ? (
            <>
              <div className={`feedback ${outcome === "right" ? "ok" : "bad"}`} role="status">
                <span className="feedback-icon">
                  <Icon name={outcome === "right" ? "check" : "x"} size={30} strokeWidth={3} />
                </span>
                <div>
                  <h3>{outcome === "right" ? "Correct!" : "Not quite"}</h3>
                  {outcome !== "right" ? (
                    <p style={{ fontWeight: 600 }}>Correct answer: <Inline text={correctText(q)} /></p>
                  ) : null}
                  {q.explanation ? <p style={{ marginTop: 4 }}><Inline text={q.explanation} /></p> : null}
                </div>
              </div>
              <button type="button" className={`btn btn-lg ${outcome === "right" ? "btn-ok" : "btn-bad"}`} onClick={() => advance()} autoFocus>
                Continue
              </button>
            </>
          ) : phase === "reveal" ? (
            <div className="row" style={{ gap: 10, width: "100%" }}>
              <button type="button" className="btn btn-bad grow" onClick={() => rate("wrong")}>Missed it</button>
              <button type="button" className="btn grow" style={{ ["--b" as string]: "var(--flame)", ["--b-edge" as string]: "#b45309" }} onClick={() => rate("partial")}>
                Partly
              </button>
              <button type="button" className="btn btn-ok grow" onClick={() => rate("right")}>Nailed it</button>
            </div>
          ) : (
            <>
              <span className="kbd-hint">{isSelfRated(q) ? "Think first, then compare with the model answer." : "Enter to check"}</span>
              <button type="button" className="btn btn-lg btn-accent" disabled={!canCheck} onClick={check}>
                {isSelfRated(q) ? (q.type === "practical" ? "Show solution" : "Reveal answer") : "Check"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
