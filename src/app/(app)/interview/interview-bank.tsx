"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { Icon } from "@/components/icons";
import { useProgress } from "@/components/progress-provider";
import { QaCard } from "@/components/qa-card";
import { LEVELS } from "@/lib/catalog";
import type { InterviewItem, Level } from "@/lib/types";

const PAGE = 30;

export function InterviewBank({ items, tracks }: { items: InterviewItem[]; tracks: { id: string; title: string; color: string; icon: string }[] }) {
  const { progress } = useProgress();
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState<string>("all");
  const [level, setLevel] = useState<Level | "all">("all");
  const [status, setStatus] = useState<"all" | "todo" | "done">("all");
  const [limit, setLimit] = useState(PAGE);
  const q = useDeferredValue(query.trim().toLowerCase());
  const practiced = useMemo(() => new Set(progress.practiced), [progress.practiced]);

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        if (track !== "all" && i.trackId !== track) return false;
        if (level !== "all" && (i.level ?? i.chapterLevel) !== level) return false;
        if (status === "done" && !practiced.has(i.id)) return false;
        if (status === "todo" && practiced.has(i.id)) return false;
        if (q && !`${i.prompt} ${i.answer} ${i.chapterTitle} ${i.trackTitle}`.toLowerCase().includes(q)) return false;
        return true;
      }),
    [items, track, level, status, q, practiced],
  );


  const mockParams = new URLSearchParams();
  if (track !== "all") mockParams.set("track", track);
  if (level !== "all") mockParams.set("level", level);

  return (
    <div className="container page stack" style={{ gap: 20 }}>
      <div className="row wrap" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Interview bank</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            {items.length} questions with model answers. {practiced.size} practiced.
          </p>
        </div>
        <Link href={`/interview/mock${mockParams.size ? `?${mockParams}` : ""}`} className="btn btn-accent">
          <Icon name="mic" size={18} /> Mock interview (5)
        </Link>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={18} />
          <label className="sr-only" htmlFor="q">Search questions</label>
          <input
            id="q"
            className="input"
            placeholder="Search: closures, indexes, hydration, JWT..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
          />
        </div>
        <div className="chip-row" role="group" aria-label="Filter by track">
          <button type="button" className="chip" aria-pressed={track === "all"} onClick={() => setTrack("all")}>All tracks</button>
          {tracks.map((t) => (
            <button key={t.id} type="button" className="chip" aria-pressed={track === t.id} onClick={() => { setTrack(t.id); setLimit(PAGE); }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: t.color }} /> {t.title}
            </button>
          ))}
        </div>
        <div className="row wrap" style={{ gap: 8 }}>
          <button type="button" className="chip" aria-pressed={level === "all"} onClick={() => setLevel("all")}>Any level</button>
          {LEVELS.map((l) => (
            <button key={l.id} type="button" className="chip" aria-pressed={level === l.id} onClick={() => { setLevel(l.id); setLimit(PAGE); }}>
              {l.label}
            </button>
          ))}
          <span style={{ width: 8 }} />
          {(["all", "todo", "done"] as const).map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={status === s} onClick={() => { setStatus(s); setLimit(PAGE); }}>
              {s === "all" ? "All" : s === "todo" ? "Not practiced" : "Practiced"}
            </button>
          ))}
        </div>
      </div>

      <p className="faint" style={{ fontWeight: 700, fontSize: 14 }}>{filtered.length} matching</p>

      {filtered.length === 0 ? (
        <div className="card empty">No questions match these filters.</div>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {filtered.slice(0, limit).map((i) => (
            <QaCard key={i.id} item={i} />
          ))}
          {filtered.length > limit ? (
            <button type="button" className="btn btn-ghost" onClick={() => setLimit((l) => l + PAGE)}>
              Show more ({filtered.length - limit} left)
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
