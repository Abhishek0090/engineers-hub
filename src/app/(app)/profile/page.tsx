import type { Metadata } from "next";

import { getSession } from "@/lib/auth/current-user";
import { getRepository } from "@/lib/data/repository";

import { ProfileView } from "./profile-view";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const [session, repo] = await Promise.all([getSession(), getRepository()]);
  const [tracks, goals] = await Promise.all([repo.listTracks(), repo.listGoals()]);
  return (
    <ProfileView
      user={{ name: session?.name ?? "", username: session?.username ?? "" }}
      tracks={tracks}
      goals={goals}
      dataSource={repo.kind}
    />
  );
}
