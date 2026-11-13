// Static data source: reads src/content/*.json once per server process.
// Progress is not stored on the server in this mode; the browser keeps it (localStorage).
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Goal, Track, UserRecord } from "@/lib/types";

import { byOrder, interviewItems, locateQuestions, summarizeTrack } from "./derive";
import type { Repository } from "./repository";

const CONTENT_DIR = join(process.cwd(), "src", "content");

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(join(CONTENT_DIR, file), "utf8")) as T;
}

async function loadTracks(): Promise<Track[]> {
  const files = (await readdir(join(CONTENT_DIR, "tracks"))).filter((f) => f.endsWith(".json"));
  const tracks = await Promise.all(files.map((f) => readJson<Track>(join("tracks", f))));
  return tracks.sort(byOrder);
}

export async function createJsonRepository(): Promise<Repository> {
  // In development re-read files on every call so edits to the JSON show up on refresh.
  const dev = process.env.NODE_ENV !== "production";
  let cache: { tracks: Track[]; goals: Goal[]; users: UserRecord[] } | null = null;
  const data = async () => {
    if (!cache || dev) {
      const [tracks, goals, users] = await Promise.all([
        loadTracks(),
        readJson<Goal[]>("goals.json"),
        readJson<UserRecord[]>("users.json"),
      ]);
      cache = { tracks, goals, users };
    }
    return cache;
  };

  return {
    kind: "json",
    persistsProgress: false,
    async listTracks() {
      return (await data()).tracks.map(summarizeTrack);
    },
    async getTrack(trackId) {
      return (await data()).tracks.find((t) => t.id === trackId) ?? null;
    },
    async listGoals() {
      return (await data()).goals;
    },
    async listInterviewQuestions() {
      return interviewItems((await data()).tracks);
    },
    async getQuestions(ids) {
      return locateQuestions((await data()).tracks, ids);
    },
    async findUserByUsername(username) {
      const u = username.trim().toLowerCase();
      return (await data()).users.find((x) => x.username.toLowerCase() === u) ?? null;
    },
    async getProgress() {
      return null;
    },
    async saveProgress() {
      // Browser-only progress in JSON mode.
    },
  };
}
