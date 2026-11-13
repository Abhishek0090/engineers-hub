// POST { ids: string[] } -> the questions with those ids (used by the review session).
import { NextResponse } from "next/server";

import { getRepository } from "@/lib/data/repository";

export async function POST(request: Request) {
  let ids: unknown;
  try {
    ids = (await request.json()).ids;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!Array.isArray(ids)) return NextResponse.json({ error: "ids must be an array" }, { status: 400 });
  const clean = ids.filter((x): x is string => typeof x === "string").slice(0, 500);
  const repo = await getRepository();
  return NextResponse.json({ questions: await repo.getQuestions(clean) });
}
