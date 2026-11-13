// The one place the app gets data from. Pages and API routes call getRepository() and never
// care whether the data lives in the JSON files or in MongoDB.
//
// Switch with the DATA_SOURCE env var:
//   DATA_SOURCE=json   (default) static files in src/content, progress stays in the browser
//   DATA_SOURCE=mongo  MongoDB (seed it with `npm run db:seed`), progress is saved per user
import type { Goal, InterviewItem, LocatedQuestion, Progress, Track, TrackSummary, UserRecord } from "@/lib/types";

export interface Repository {
  /** "json" or "mongo", shown in the footer and used by the progress API. */
  readonly kind: "json" | "mongo";
  /** True when progress is stored server side (per user) instead of only in the browser. */
  readonly persistsProgress: boolean;

  listTracks(): Promise<TrackSummary[]>;
  getTrack(trackId: string): Promise<Track | null>;
  listGoals(): Promise<Goal[]>;
  listInterviewQuestions(): Promise<InterviewItem[]>;
  getQuestions(ids: string[]): Promise<LocatedQuestion[]>;

  findUserByUsername(username: string): Promise<UserRecord | null>;
  getProgress(userId: string): Promise<Progress | null>;
  saveProgress(userId: string, progress: Progress): Promise<void>;
}

let instance: Promise<Repository> | null = null;

export function getRepository(): Promise<Repository> {
  if (!instance) {
    const source = (process.env.DATA_SOURCE ?? "json").toLowerCase();
    instance =
      source === "mongo"
        ? import("./mongo-repository").then((m) => m.createMongoRepository())
        : import("./json-repository").then((m) => m.createJsonRepository());
    instance.catch(() => {
      instance = null; // retry on the next request instead of caching the failure
    });
  }
  return instance;
}
