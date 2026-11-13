// GET  -> { persist, progress }  persist=false in JSON mode (the browser keeps progress)
// PUT  -> saves the learner's progress when the data source is MongoDB
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/current-user";
import { getRepository } from "@/lib/data/repository";
import { sanitizeProgress } from "@/lib/progress";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const repo = await getRepository();
  if (!repo.persistsProgress) return NextResponse.json({ persist: false, progress: null });
  return NextResponse.json({ persist: true, progress: await repo.getProgress(session.sub) });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const repo = await getRepository();
  if (!repo.persistsProgress) return NextResponse.json({ persist: false });
  const raw = await request.text();
  if (raw.length > 500_000) return NextResponse.json({ error: "Progress too large" }, { status: 413 });
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  await repo.saveProgress(session.sub, sanitizeProgress(parsed));
  return NextResponse.json({ persist: true });
}
