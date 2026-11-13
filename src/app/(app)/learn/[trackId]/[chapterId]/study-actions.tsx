"use client";

import Link from "next/link";

import { Icon } from "@/components/icons";
import { useProgress } from "@/components/progress-provider";
import { markStudied, XP_STUDY } from "@/lib/progress";

export function StudyActions({ trackId, chapterId }: { trackId: string; chapterId: string }) {
  const { progress, update } = useProgress();
  const ch = progress.chapters[chapterId];
  const studied = !!ch?.studied;

  return (
    <div className="card stack" style={{ gap: 14, borderColor: "var(--brand)" }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>{studied ? "Lesson done. Time to practice." : "Finished reading?"}</h2>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          {ch?.attempts
            ? `Best practice score: ${ch.bestScore}% in ${ch.attempts} attempt${ch.attempts > 1 ? "s" : ""}.`
            : `Mark the lesson as studied (+${XP_STUDY} XP), then test yourself.`}
        </p>
      </div>
      <div className="row wrap">
        {!studied ? (
          <button type="button" className="btn btn-ghost" onClick={() => update((p) => markStudied(p, chapterId))}>
            <Icon name="check" size={18} /> Mark as studied
          </button>
        ) : null}
        <Link
          href={`/learn/${trackId}/${chapterId}/practice`}
          className="btn btn-accent"
          onClick={() => update((p) => markStudied(p, chapterId))}
        >
          <Icon name="bolt" size={18} /> {ch?.attempts ? "Practice again" : "Start practice"}
        </Link>
      </div>
    </div>
  );
}
