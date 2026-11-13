import { NextResponse } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";

export async function POST(request: Request) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const username = typeof body.username === "string" ? body.username.slice(0, 100) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  if (!username || !password) return NextResponse.json({ error: "Enter your username and password" }, { status: 400 });

  const repo = await getRepository();
  const user = await repo.findUserByUsername(username);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Wrong username or password" }, { status: 401 });
  }

  const { passwordHash: _hash, ...publicUser } = user;
  void _hash;
  const res = NextResponse.json({ user: publicUser });
  res.cookies.set(SESSION_COOKIE, await signSession(publicUser), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
