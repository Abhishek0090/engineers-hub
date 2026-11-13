import Link from "next/link";

export default function NotFound() {
  return (
    <main className="result" style={{ paddingTop: 96 }}>
      <h1 className="page-title">Page not found</h1>
      <p className="muted" style={{ marginTop: 8 }}>That chapter or page does not exist.</p>
      <Link href="/learn" className="btn" style={{ marginTop: 24 }}>
        Back to learning
      </Link>
    </main>
  );
}
