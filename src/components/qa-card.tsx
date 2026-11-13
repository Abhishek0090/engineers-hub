"use client";

import Link from "next/link";

import { levelLabel } from "@/lib/catalog";
import type { InterviewItem } from "@/lib/types";

import { CodeBlock } from "./code-block";
import { FilledIcon, Icon } from "./icons";
import { useProgress } from "./progress-provider";
import { Inline, RichText } from "./rich-text";

/** Expandable interview question with its model answer and a "practiced" toggle. */
export function QaCard({ item, showTrack = true, number }: { item: InterviewItem; showTrack?: boolean; number?: number }) {
  const { progress, update } = useProgress();
  const done = progress.practiced.includes(item.id);
  const lvl = item.level ?? item.chapterLevel;
  const toggle = () =>
    update((p) => ({
      ...p,
      practiced: p.practiced.includes(item.id) ? p.practiced.filter((x) => x !== item.id) : [...p.practiced, item.id],
      updatedAt: new Date().toISOString(),
    }));

  return (
    <details className={`qa${done ? " done" : ""}`}>
      <summary>
        <Icon name="chevronRight" size={18} className="chev" />
        <div className="grow">
          <p style={{ fontWeight: 600 }}>
            {number ? <span className="faint" style={{ marginRight: 8 }}>{number}.</span> : null}
            <Inline text={item.prompt} />
          </p>
          <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
            {item.top ? (
              <span className="badge" style={{ color: "var(--gold)" }}>
                <FilledIcon name="star" size={11} /> Most asked
              </span>
            ) : null}
            {showTrack ? (
              <span className="badge" style={{ background: `color-mix(in srgb, ${item.trackColor} 20%, transparent)`, color: "var(--text)" }}>
                {item.trackTitle}
              </span>
            ) : null}
            <span className={`badge lvl-${lvl}`}>{levelLabel(lvl)}</span>
            {done ? (
              <span className="badge" style={{ color: "var(--ok)" }}>
                <Icon name="check" size={12} /> Practiced
              </span>
            ) : null}
          </div>
        </div>
      </summary>
      <div className="qa-body stack" style={{ gap: 14 }}>
        {item.code ? <CodeBlock source={item.code} /> : null}
        <div className="answer-box" style={{ marginTop: 0 }}>
          <p className="label" style={{ color: "var(--brand)" }}>Model answer</p>
          <RichText text={item.answer} />
        </div>
        <div className="row wrap" style={{ justifyContent: "space-between" }}>
          <Link href={`/learn/${item.trackId}/${item.chapterId}`} className="link" style={{ fontSize: 14 }}>
            Study the chapter: {item.chapterTitle}
          </Link>
          <button type="button" className={`btn btn-sm ${done ? "btn-ghost" : "btn-ok"}`} onClick={toggle}>
            {done ? "Mark as not practiced" : "Mark as practiced"}
          </button>
        </div>
      </div>
    </details>
  );
}
