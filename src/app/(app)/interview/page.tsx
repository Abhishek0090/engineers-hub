import type { Metadata } from "next";

import { getRepository } from "@/lib/data/repository";

import { InterviewBank } from "./interview-bank";

export const metadata: Metadata = { title: "Question bank" };

export default async function InterviewPage() {
  const repo = await getRepository();
  const [items, tracks] = await Promise.all([repo.listInterviewQuestions(), repo.listTracks()]);
  const trackList = tracks
    .filter((t) => items.some((i) => i.trackId === t.id))
    .map((t) => ({ id: t.id, title: t.title, color: t.color, icon: t.icon, program: t.program }));
  return <InterviewBank items={items} tracks={trackList} />;
}
