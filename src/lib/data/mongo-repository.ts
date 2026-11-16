// MongoDB data source. Collections (filled by `npm run db:seed`):
//   tracks    one document per track, same shape as src/content/tracks/*.json (_id = track id)
//   goals     same shape as src/content/goals.json entries (_id = goal id)
//   users     same shape as src/content/users.json entries (_id = user id, unique username)
//   progress  one document per user (_id = user id), shape of Progress
import type { Collection, Db, Document, MongoClient } from "mongodb";

import type { Goal, Progress, Track, UserRecord } from "@/lib/types";

import { byOrder, expandTrack, interviewItems, locateQuestions, summarizeTrack } from "./derive";
import type { Repository } from "./repository";

type WithId<T> = Omit<T, "id"> & { _id: string };

const globalForMongo = globalThis as unknown as { __sehMongo?: Promise<MongoClient> };

async function connect(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("DATA_SOURCE=mongo but MONGODB_URI is not set. See .env.example.");
  if (!globalForMongo.__sehMongo) {
    // One client per process; reused across hot reloads in development.
    globalForMongo.__sehMongo = import("mongodb").then(({ MongoClient }) => new MongoClient(uri).connect());
    globalForMongo.__sehMongo.catch(() => {
      globalForMongo.__sehMongo = undefined;
    });
  }
  const client = await globalForMongo.__sehMongo;
  return client.db(process.env.MONGODB_DB || "software_engineers_hub");
}

const fromDoc = <T extends { id: string }>(doc: WithId<T> | null): T | null => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { ...(rest as unknown as Omit<T, "id">), id: _id } as T;
};

export async function createMongoRepository(): Promise<Repository> {
  const db = await connect();
  const tracks = db.collection<WithId<Track>>("tracks");
  const goals = db.collection<WithId<Goal>>("goals");
  const users = db.collection<WithId<UserRecord>>("users");
  const progress = db.collection<Progress & { _id: string } & Document>("progress");

  const allTracks = async () =>
    (await tracks.find().toArray()).map((d) => expandTrack(fromDoc<Track>(d as WithId<Track>)!)).sort(byOrder);
  const summaries = async (col: Collection<WithId<Track>>) =>
    (await col.find().toArray()).map((d) => summarizeTrack(fromDoc<Track>(d as WithId<Track>)!)).sort(byOrder);

  return {
    kind: "mongo",
    persistsProgress: true,
    listTracks: () => summaries(tracks),
    async getTrack(trackId) {
      const track = fromDoc<Track>((await tracks.findOne({ _id: trackId })) as WithId<Track> | null);
      return track ? expandTrack(track) : null;
    },
    async listGoals() {
      const docs = await goals.find().toArray();
      return docs.map((d) => fromDoc<Goal>(d as WithId<Goal>)!);
    },
    async listInterviewQuestions() {
      return interviewItems(await allTracks());
    },
    async getQuestions(ids) {
      return locateQuestions(await allTracks(), ids);
    },
    async findUserByUsername(username) {
      const doc = await users.findOne({ username: username.trim().toLowerCase() });
      return fromDoc<UserRecord>(doc as WithId<UserRecord> | null);
    },
    async getProgress(userId) {
      const doc = await progress.findOne({ _id: userId });
      if (!doc) return null;
      const { _id: _ignored, ...rest } = doc;
      void _ignored;
      return rest as Progress;
    },
    async saveProgress(userId, value) {
      await progress.replaceOne({ _id: userId }, { ...value, _id: userId }, { upsert: true });
    },
  };
}
