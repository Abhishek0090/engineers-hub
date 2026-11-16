"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { programConfig, programOfId, progressProgram } from "@/lib/catalog";
import { currentStreak } from "@/lib/progress";

import { FilledIcon, Icon, type IconName } from "./icons";
import { Logo } from "./logo";
import { useProgress } from "./progress-provider";
import { ThemeToggle } from "./theme-toggle";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/learn", label: "Learn", icon: "home" },
  // The question bank label comes from the current program ("Interview", "Theory").
  { href: "/interview", label: "", icon: "mic" },
  { href: "/review", label: "Review", icon: "refresh" },
  { href: "/profile", label: "Profile", icon: "user" },
];

/** Practice sessions run full screen, without the navigation chrome. */
const isFocusRoute = (p: string) => p.endsWith("/practice") || p.startsWith("/review/session") || p.startsWith("/interview/mock");

export function AppShell({ user, children }: { user: { name: string; username: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { progress } = useProgress();

  if (isFocusRoute(pathname)) return <>{children}</>;

  const active = (href: string) => (href === "/learn" ? pathname === "/learn" || pathname.startsWith("/learn/") : pathname.startsWith(href));
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };
  const streak = currentStreak(progress);
  const program = programConfig(progressProgram(progress));
  const mistakes = progress.mistakes.filter((id) => programOfId(id) === program.id).length;
  const nav = NAV.map((n) => (n.href === "/interview" ? { ...n, label: program.terms.nav } : n));

  return (
    <div className="app">
      <aside className="sidebar">
        <div style={{ padding: "0 8px 20px" }}>
          <Logo href="/learn" sub={program.short} />
        </div>
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="nav-item" aria-current={active(n.href) ? "page" : undefined}>
            <Icon name={n.icon} size={22} /> {n.label}
            {n.href === "/review" && mistakes > 0 ? (
              <span className="badge" style={{ marginLeft: "auto", background: "var(--bad)", color: "#fff" }}>
                {mistakes}
              </span>
            ) : null}
          </Link>
        ))}
        <div style={{ marginTop: "auto" }} className="stack">
          <div className="card" style={{ padding: 14 }}>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</p>
            <p className="faint" style={{ fontSize: 13 }}>@{user.username}</p>
          </div>
          <button type="button" className="nav-item" onClick={logout} style={{ background: "none", width: "100%" }}>
            <Icon name="logout" size={22} /> Log out
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="container topbar-inner">
            <div className="mobile-logo">
              <Logo href="/learn" sub={program.short} />
            </div>
            <div className="row" style={{ marginLeft: "auto", gap: 4 }}>
              <Link href="/profile" className="pill-stat" style={{ color: streak ? "var(--flame)" : "var(--text-3)" }} title="Day streak">
                <FilledIcon name="flame" size={20} /> {streak}
              </Link>
              <Link href="/profile" className="pill-stat" style={{ color: "var(--gold)" }} title="Total XP">
                <FilledIcon name="bolt" size={20} /> {progress.xp.toLocaleString("en-US")}
              </Link>
              <Link href="/review" className="pill-stat" style={{ color: mistakes ? "var(--bad)" : "var(--text-3)" }} title="Questions to review">
                <Icon name="refresh" size={18} /> {mistakes}
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>

      <nav className="bottom-nav" aria-label="Main">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}>
            <Icon name={n.icon} size={22} />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
