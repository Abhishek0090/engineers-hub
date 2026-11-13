import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Only allow redirects back into this site.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/learn";
  return (
    <>
      <SiteHeader signedIn={false} />
      <main className="auth-wrap">
        <div className="auth-card stack">
          <div style={{ textAlign: "center" }}>
            <h1 className="page-title">Welcome back</h1>
            <p className="muted" style={{ marginTop: 6 }}>Log in to continue your streak.</p>
          </div>
          <LoginForm next={safeNext} />
        </div>
      </main>
    </>
  );
}
