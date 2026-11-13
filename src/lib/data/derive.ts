// Pure helpers shared by every repository implementation.
import type { InterviewItem, LocatedQuestion, Track, TrackSummary } from "@/lib/types";

export function summarizeTrack(track: Track): TrackSummary {
  const chapters = track.chapters.map((c) => ({
    id: c.id,
    title: c.title,
    level: c.level,
    summary: c.summary,
    estMinutes: c.estMinutes,
    questionCount: c.questions.length,
    interviewCount: c.questions.filter((q) => q.type === "interview").length,
  }));
  return {
    id: track.id,
    title: track.title,
    area: track.area,
    order: track.order,
    icon: track.icon,
    color: track.color,
    description: track.description,
    chapters,
    questionCount: chapters.reduce((n, c) => n + c.questionCount, 0),
  };
}

export function interviewItems(tracks: Track[]): InterviewItem[] {
  const items: InterviewItem[] = [];
  for (const t of tracks)
    for (const c of t.chapters)
      for (const q of c.questions)
        if (q.type === "interview")
          items.push({
            ...q,
            level: q.level ?? c.level,
            trackId: t.id,
            trackTitle: t.title,
            trackColor: t.color,
            chapterId: c.id,
            chapterTitle: c.title,
            chapterLevel: c.level,
          });
  return items;
}

export function locateQuestions(tracks: Track[], ids: string[]): LocatedQuestion[] {
  const wanted = new Set(ids);
  const found: LocatedQuestion[] = [];
  for (const t of tracks)
    for (const c of t.chapters)
      for (const q of c.questions)
        if (wanted.has(q.id)) found.push({ question: q, trackId: t.id, chapterId: c.id, chapterTitle: c.title });
  return found;
}

/**
 * The most asked interview questions of one track: questions flagged `top: true` first,
 * then the remaining ones picked round-robin across chapters (1st of every chapter, then 2nd...)
 * so the list covers beginner to advanced.
 */
export function topInterviewQuestions(items: InterviewItem[], limit = 15): InterviewItem[] {
  const flagged = items.filter((i) => i.top);
  const byChapter = new Map<string, InterviewItem[]>();
  for (const i of items) if (!i.top) byChapter.set(i.chapterId, [...(byChapter.get(i.chapterId) ?? []), i]);
  const rest: InterviewItem[] = [];
  for (let round = 0; rest.length + flagged.length < limit; round++) {
    let added = false;
    for (const list of byChapter.values())
      if (list[round]) {
        rest.push(list[round]);
        added = true;
      }
    if (!added) break;
  }
  return [...flagged, ...rest].slice(0, limit);
}

export const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;
