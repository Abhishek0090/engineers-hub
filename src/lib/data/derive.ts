// Pure helpers shared by every repository implementation.
import { programOf } from "@/lib/catalog";
import { isSelfRated, type InterviewItem, type LocatedQuestion, type Track, type TrackSummary } from "@/lib/types";

/**
 * Prepares a track as stored for use in the app. Every question gets its `program` (from the
 * track's area), and questions that point at a chapter case study get its title and text in
 * `caseTitle` and `caseBody`, so every screen that shows a question (practice, review) can
 * label it and render the case without looking up the track or chapter.
 */
export function expandTrack(track: Track): Track {
  const program = programOf(track.area);
  return {
    ...track,
    chapters: track.chapters.map((c) => {
      const cases = new Map((c.cases ?? []).map((k) => [k.id, k]));
      return {
        ...c,
        questions: c.questions.map((q) => {
          const k = q.caseId ? cases.get(q.caseId) : undefined;
          return k ? { ...q, program, caseTitle: k.title, caseBody: k.body } : { ...q, program };
        }),
      };
    }),
  };
}

export function summarizeTrack(track: Track): TrackSummary {
  const chapters = track.chapters.map((c) => ({
    id: c.id,
    title: c.title,
    level: c.level,
    summary: c.summary,
    estMinutes: c.estMinutes,
    questionCount: c.questions.length,
    interviewCount: c.questions.filter(isSelfRated).length,
  }));
  return {
    id: track.id,
    title: track.title,
    area: track.area,
    order: track.order,
    icon: track.icon,
    color: track.color,
    description: track.description,
    program: programOf(track.area),
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
            program: programOf(t.area),
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
