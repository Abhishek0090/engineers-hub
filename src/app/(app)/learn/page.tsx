import type { Metadata } from "next";

import { getSession } from "@/lib/auth/current-user";
import { getRepository } from "@/lib/data/repository";

import { Dashboard } from "./dashboard";

export const metadata: Metadata = { title: "Learn" };

export default async function LearnPage() {
  const [session, repo] = await Promise.all([getSession(), getRepository()]);
  const [tracks, goals] = await Promise.all([repo.listTracks(), repo.listGoals()]);
  return <Dashboard tracks={tracks} goals={goals} firstName={(session?.name ?? "there").split(" ")[0]} />;
}
