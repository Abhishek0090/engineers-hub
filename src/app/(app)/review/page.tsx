"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";
import { useProgress } from "@/components/progress-provider";
import { Inline } from "@/components/rich-text";
import type { LocatedQuestion } from "@/lib/types";

export default function ReviewPage() {
  const { progress, ready, update } = useProgress();
  const [items, setItems] = useState<LocatedQuestion[] | null>(null);
  const ids = progress.mistakes;
  const key = ids.join(",");

  useEffect(() => {
    if (!ready) return;
    if (!key) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to fetch
      setItems([]);
      return;
    }
    let cancelled = false;
    fetch("/api/questions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: key.split(",") }) })
      .then((r) => r.json())
      .then((d) => !cancelled && setItems(d.questions ?? []))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [key, ready]);

  return (
    <div className="container page stack" style={{ gap: 20, maxWidth: 860 }}>
      <div className="row wrap" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Review</h1>
          <p className="muted" style={{ marginTop: 4 }}>Questions you missed stay here until you answer them right.</p>
        </div>
        {ids.length ? (
          <Link href="/review/session" className="btn btn-accent">
            <Icon name="refresh" size={18} /> Review {Math.min(ids.length, 15)} now
          </Link>
        ) : null}
      </div>

      {items === null ? (
        <div className="card empty">Loading...</div>
      ) : items.length === 0 ? (
        <div className="card empty stack" style={{ alignItems: "center" }}>
          <Icon name="check" size={40} style={{ color: "var(--ok)" }} />
          <p style={{ fontWeight: 600 }}>Nothing to review. Nice.</p>
          <Link href="/learn" className="btn btn-sm">Keep learning</Link>
        </div>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {items.map((i) => (
            <div key={i.question.id} className="card row" style={{ padding: 16, alignItems: "flex-start" }}>
              <div className="grow">
                <p style={{ fontWeight: 600 }}><Inline text={i.question.prompt} /></p>
                <Link href={`/learn/${i.trackId}/${i.chapterId}`} className="faint" style={{ fontSize: 13, fontWeight: 700 }}>
                  {i.chapterTitle}
                </Link>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Remove from review"
                title="Remove from review"
                onClick={() => update((p) => ({ ...p, mistakes: p.mistakes.filter((x) => x !== i.question.id), updatedAt: new Date().toISOString() }))}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
