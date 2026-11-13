#!/usr/bin/env node
// Copies the static JSON content (tracks, goals, users) into MongoDB.
// Safe to run again: documents are replaced by id, learner progress is never touched.
//
//   npm run db:up        start MongoDB with docker compose
//   npm run db:seed      run this script
//   then set DATA_SOURCE=mongo in .env.local and restart the dev server.
//
// Reads MONGODB_URI and MONGODB_DB from the environment, .env.local or .env.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { MongoClient } from "mongodb";

const ROOT = process.cwd();
for (const file of [".env.local", ".env"]) {
  const path = join(ROOT, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "software_engineers_hub";
const content = join(ROOT, "src", "content");
const read = (p) => JSON.parse(readFileSync(join(content, p), "utf8"));

const tracks = readdirSync(join(content, "tracks"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => read(join("tracks", f)));
const goals = read("goals.json");
const users = read("users.json").map((u) => ({ ...u, username: u.username.toLowerCase() }));

const toDoc = ({ id, ...rest }) => ({ _id: id, ...rest });

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
try {
  await client.connect();
  const db = client.db(dbName);
  console.log(`Seeding ${dbName} at ${uri.replace(/\/\/[^@]*@/, "//***@")}`);

  const upsertAll = async (name, items) => {
    const col = db.collection(name);
    if (!items.length) return;
    await col.bulkWrite(items.map((item) => ({ replaceOne: { filter: { _id: item.id }, replacement: toDoc(item), upsert: true } })));
    console.log(`  ${name.padEnd(9)} ${items.length}`);
  };
  await upsertAll("tracks", tracks);
  await upsertAll("goals", goals);
  await upsertAll("users", users);

  // Remove tracks/goals that no longer exist in the JSON files.
  await db.collection("tracks").deleteMany({ _id: { $nin: tracks.map((t) => t.id) } });
  await db.collection("goals").deleteMany({ _id: { $nin: goals.map((g) => g.id) } });

  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("tracks").createIndex({ order: 1 });

  const questions = tracks.reduce((n, t) => n + t.chapters.reduce((m, c) => m + c.questions.length, 0), 0);
  console.log(`Done: ${tracks.length} tracks, ${questions} questions. Set DATA_SOURCE=mongo and restart the app.`);
} catch (e) {
  console.error("Seeding failed: " + e.message);
  console.error("Is MongoDB running? Start it with: npm run db:up");
  process.exitCode = 1;
} finally {
  await client.close();
}
