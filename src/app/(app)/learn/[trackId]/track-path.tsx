"use client";

import Link from "next/link";

import { FilledIcon, Icon } from "@/components/icons";
import { useProgress } from "@/components/progress-provider";
import { QaCard } from "@/components/qa-card";
import { LEVELS } from "@/lib/catalog";
import { chapterState, type ChapterState, trackStats } from "@/lib/progress";
import { programConfig } from "@/lib/catalog";
import type { InterviewItem, TrackSummary } from "@/lib/types";


// Zig-zag offsets for the path, repeating.
const SHIFTS = [0, 56, 84, 56, 0, -56, -84, -56];

const STATE_TEXT: Record<ChapterState, string> = {
  new: "Not started",
  studied: "Studied",
  practiced: "Practiced, not mastered yet",
  mastered: "Mastered",
};

export function TrackPath({
  track,
  topQuestions,
  interviewTotal,
}: {
  track: TrackSummary;
  topQuestions: InterviewItem[];
  interviewTotal: number;
}) {
  const { progress } = useProgress();
  const stats = trackStats(track, progress);
  const terms = programConfig(track.program).terms;
  const currentId = stats.next?.id;
  let index = 0;

  return (
    <div className="container page">
      <div className="layout-2">
        <div>
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/learn">Learn</Link>
            <Icon name="chevronRight" size={14} />
            <span>{track.title}</span>
          </nav>

          <div className="track-hero" style={{ ["--tc" as string]: track.color, marginTop: 12 }}>
            <div className="row" style={{ gap: 16 }}>
              <span className="track-badge lg" style={{ ["--tc" as string]: "rgba(255,255,255,0.18)" }}>{track.icon}</span>
              <div className="grow">
                <h1 className="page-title">{track.title}</h1>
                <p className="muted" style={{ marginTop: 4 }}>{track.description}</p>
              </div>
            </div>
            <div className="row" style={{ marginTop: 18, gap: 14 }}>
              <div className="bar grow" style={{ background: "rgba(255,255,255,0.22)", ["--bc" as string]: "#fff" }}>
                <span style={{ width: `${stats.pct}%` }} />
              </div>
              <b style={{ fontSize: 14 }}>{stats.mastered}/{stats.total} mastered</b>
            </div>
          </div>

          {LEVELS.map((level) => {
            const chapters = track.chapters.filter((c) => c.level === level.id);
            if (!chapters.length) return null;
            return (
              <section key={level.id} aria-label={level.label}>
                <div className="level-divider">{level.label}</div>
                <div className="path">
                  {chapters.map((c) => {
                    const state = chapterState(progress, c.id);
                    const isCurrent = c.id === currentId;
                    const shift = SHIFTS[index++ % SHIFTS.length];
                    return (
                      <div key={c.id} className="path-step" style={{ ["--shift" as string]: `${shift}px` }}>
                        <Link
                          href={`/learn/${track.id}/${c.id}`}
                          className={`node ${isCurrent ? "current" : state}`}
                          aria-label={`${c.title}: ${STATE_TEXT[state]}`}
                        >
                          {isCurrent && state === "new" ? <span className="start-tag">START</span> : null}
                          {state === "mastered" ? (
                            <Icon name="check" size={30} strokeWidth={3.2} />
                          ) : isCurrent ? (
                            <FilledIcon name="star" size={28} />
                          ) : state === "practiced" ? (
                            <Icon name="bolt" size={26} />
                          ) : (
                            <Icon name="book" size={24} />
                          )}
                        </Link>
                        <Link href={`/learn/${track.id}/${c.id}`} className="node-label">
                          <h3>{c.title}</h3>
                          <p>
                            {c.estMinutes} min, {c.questionCount} questions
                            {progress.chapters[c.id]?.attempts ? `, best ${progress.chapters[c.id].bestScore}%` : ""}
                          </p>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {topQuestions.length ? (
            <section id="most-asked" className="stack" style={{ gap: 12, marginTop: 56 }} aria-labelledby="most-asked-title">
              <div className="row wrap" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <span className="eyebrow">{terms.prepEyebrow}</span>
                  <h2 id="most-asked-title" style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
                    {terms.mostAsked} {track.title} questions
                  </h2>
                  <p className="muted" style={{ marginTop: 4, fontSize: 15 }}>{terms.prepText}</p>
                </div>
                <div className="row wrap" style={{ gap: 10 }}>
                  <Link href={`/interview/mock?track=${track.id}`} className="btn btn-sm">
                    <Icon name="mic" size={16} /> {terms.roundShort}
                  </Link>
                  {interviewTotal > topQuestions.length ? (
                    <Link href="/interview" className="btn btn-sm btn-ghost">
                      All {interviewTotal}
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="stack" style={{ gap: 10 }}>
                {topQuestions.map((q, i) => (
                  <QaCard key={q.id} item={q} showTrack={false} number={i + 1} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="stack">
          {stats.next ? (
            <div className="card stack" style={{ gap: 10 }}>
              <span className="eyebrow">Up next</span>
              <h3 style={{ fontWeight: 700 }}>{stats.next.title}</h3>
              <p className="muted" style={{ fontSize: 14 }}>{stats.next.summary}</p>
              <Link href={`/learn/${track.id}/${stats.next.id}`} className="btn btn-block">
                Study chapter
              </Link>
              <Link href={`/learn/${track.id}/${stats.next.id}/practice`} className="btn btn-block btn-ghost">
                Jump to practice
              </Link>
            </div>
          ) : (
            <div className="card">
              <h3 style={{ fontWeight: 700 }}>Track mastered</h3>
              <p className="muted" style={{ fontSize: 14 }}>Practice any chapter again to keep it fresh.</p>
            </div>
          )}
          {topQuestions.length ? (
            <a href="#most-asked" className="card card-link row">
              <FilledIcon name="star" size={24} style={{ color: "var(--gold)" }} />
              <div className="grow">
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>{terms.mostAsked} questions</h3>
                <p className="faint" style={{ fontSize: 13, fontWeight: 600 }}>
                  {topQuestions.length} top {track.title} {terms.kind} questions
                </p>
              </div>
            </a>
          ) : null}
          <div className="card stack" style={{ gap: 8 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16 }}>Legend</h3>
            {(["new", "studied", "practiced", "mastered"] as ChapterState[]).map((s) => (
              <div key={s} className="row" style={{ gap: 10, fontSize: 14 }}>
                <span className={`node ${s}`} style={{ width: 22, height: 20, boxShadow: "none" }} />
                {STATE_TEXT[s]}
              </div>
            ))}
            <p className="faint" style={{ fontSize: 13 }}>A chapter is mastered at 80% or more in practice.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
