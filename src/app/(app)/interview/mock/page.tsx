import type { Metadata } from "next";
import Link from "next/link";

import { PracticePlayer } from "@/components/practice-player";
import { getRepository } from "@/lib/data/repository";

export const metadata: Metadata = { title: "Mock interview" };

// Random helpers live outside the component: each request is a new round.
function pickRandom<T>(pool: T[], n: number): T[] {
  const a = [...pool];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function nextRoundHref(track?: string, level?: string) {
  const p = new URLSearchParams({ r: String(Date.now()) });
  if (track) p.set("track", track);
  if (level) p.set("level", level);
  return `/interview/mock?${p}`;
}

export default async function MockInterviewPage({ searchParams }: { searchParams: Promise<{ track?: string; level?: string }> }) {
  const { track, level } = await searchParams;
  const all = await (await getRepository()).listInterviewQuestions();
  const pool = all.filter((i) => (!track || i.trackId === track) && (!level || (i.level ?? i.chapterLevel) === level));
  const picked = pickRandom(pool, 5);

  if (!picked.length) {
    return (
      <div className="result">
        <h1 className="page-title">No questions for this filter</h1>
        <Link href="/interview" className="btn" style={{ marginTop: 20 }}>Back to the bank</Link>
      </div>
    );
  }

  return (
    <PracticePlayer
      autoStart
      items={picked.map((i) => ({ question: i, context: `${i.trackTitle} - ${i.chapterTitle}` }))}
      title="Mock interview"
      exitHref="/interview"
      next={{ href: nextRoundHref(track, level), label: "New mock round" }}
    />
  );
}
