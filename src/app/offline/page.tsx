import type { Metadata } from "next";
import Link from "next/link";

import { Icon } from "@/components/icons";
import { LogoMark } from "@/components/logo";

export const metadata: Metadata = { title: "Offline" };
export const dynamic = "force-static";

// Shown by the service worker when a page is requested offline and was never visited before.
export default function OfflinePage() {
  return (
    <main className="result stack" style={{ minHeight: "100dvh", justifyContent: "center", alignItems: "center", gap: 16 }}>
      <LogoMark size={56} />
      <h1 className="page-title">You are offline</h1>
      <p className="muted" style={{ maxWidth: 420, textAlign: "center" }}>
        This page has not been saved on this device yet. Lessons and tracks you opened before still work offline, and your
        progress is kept until you reconnect.
      </p>
      <div className="row wrap" style={{ gap: 10, justifyContent: "center" }}>
        <Link href="/learn" className="btn btn-accent">
          <Icon name="home" size={18} /> Go to Learn
        </Link>
        <Link href="/review" className="btn btn-ghost">
          <Icon name="refresh" size={18} /> Review
        </Link>
      </div>
    </main>
  );
}
