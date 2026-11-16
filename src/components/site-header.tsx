import Link from "next/link";

import { AUTHOR, SITE_NAME } from "@/lib/catalog";

import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="site-header">
      <div className="container">
        <Logo />
        <nav className="site-nav" aria-label="Main">
          <Link href="/#goals">Goals</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/#curriculum">Curriculum</Link>
        </nav>
        <div className="row" style={{ marginLeft: "auto" }}>
          <ThemeToggle />
          {signedIn ? (
            <Link href="/learn" className="btn btn-sm">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn btn-sm">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ dataSource }: { dataSource?: string }) {
  return (
    <footer className="site-footer">
      <div className="container row wrap" style={{ justifyContent: "space-between" }}>
        <span>{SITE_NAME}. Built by {AUTHOR} for daily practice.</span>
        {dataSource ? <span>Data source: {dataSource === "mongo" ? "MongoDB" : "static JSON"}</span> : null}
      </div>
    </footer>
  );
}
