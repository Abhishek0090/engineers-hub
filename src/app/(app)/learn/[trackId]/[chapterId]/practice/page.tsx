import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PracticePlayer } from "@/components/practice-player";
import { getRepository } from "@/lib/data/repository";

type Params = Promise<{ trackId: string; chapterId: string }>;

export const metadata: Metadata = { title: "Practice" };

export default async function PracticePage({ params }: { params: Params }) {
  const { trackId, chapterId } = await params;
  const track = await (await getRepository()).getTrack(trackId);
  const idx = track?.chapters.findIndex((c) => c.id === chapterId) ?? -1;
  if (!track || idx < 0) notFound();
  const chapter = track.chapters[idx];
  const next = track.chapters[idx + 1];

  return (
    <PracticePlayer
      items={chapter.questions.map((question) => ({ question }))}
      title={chapter.title}
      subtitle={track.title}
      chapterId={chapter.id}
      exitHref={`/learn/${track.id}/${chapter.id}`}
      next={next ? { href: `/learn/${track.id}/${next.id}`, label: `Next: ${next.title}` } : { href: `/learn/${track.id}`, label: "Back to track" }}
    />
  );
}
