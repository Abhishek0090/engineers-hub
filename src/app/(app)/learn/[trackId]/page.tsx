import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { topInterviewQuestions } from "@/lib/data/derive";
import { getRepository } from "@/lib/data/repository";

import { TrackPath } from "./track-path";

type Params = Promise<{ trackId: string }>;

async function loadTrack(trackId: string) {
  const repo = await getRepository();
  return (await repo.listTracks()).find((t) => t.id === trackId) ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const track = await loadTrack((await params).trackId);
  return { title: track?.title ?? "Track" };
}

export default async function TrackPage({ params }: { params: Params }) {
  const { trackId } = await params;
  const track = await loadTrack(trackId);
  if (!track) notFound();
  const interview = (await (await getRepository()).listInterviewQuestions()).filter((i) => i.trackId === trackId);
  return <TrackPath track={track} topQuestions={topInterviewQuestions(interview, 15)} interviewTotal={interview.length} />;
}
