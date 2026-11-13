"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PracticePlayer, type PracticeItem } from "@/components/practice-player";
import { useProgress } from "@/components/progress-provider";
import type { LocatedQuestion } from "@/lib/types";

const MAX = 15;

export default function ReviewSessionPage() {
  const { progress, ready } = useProgress();
  const [items, setItems] = useState<PracticeItem[] | null>(null);

  useEffect(() => {
    if (!ready || items) return;
    // Take the snapshot once; answering updates the mistakes list while the session runs.
    const ids = progress.mistakes.slice(-MAX);
    if (!ids.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to fetch
      setItems([]);
      return;
    }
    fetch("/api/questions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids }) })
      .then((r) => r.json())
      .then((d: { questions: LocatedQuestion[] }) => setItems(d.questions.map((q) => ({ question: q.question, context: q.chapterTitle }))))
      .catch(() => setItems([]));
  }, [ready, items, progress.mistakes]);

  if (!items) return <div className="result">Loading your review...</div>;
  if (!items.length)
    return (
      <div className="result stack">
        <h1 className="page-title">Nothing to review</h1>
        <Link href="/learn" className="btn">Back to learning</Link>
      </div>
    );
  return <PracticePlayer autoStart items={items} title="Review" exitHref="/review" next={{ href: "/review", label: "Back to review" }} />;
}
