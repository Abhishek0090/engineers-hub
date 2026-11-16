import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CodeBlock } from "@/components/code-block";
import { Icon } from "@/components/icons";
import { Inline, RichText } from "@/components/rich-text";
import { levelLabel, programConfig, programOf } from "@/lib/catalog";
import { getRepository } from "@/lib/data/repository";

import { StudyActions } from "./study-actions";

type Params = Promise<{ trackId: string; chapterId: string }>;

async function load(params: Params) {
  const { trackId, chapterId } = await params;
  const track = await (await getRepository()).getTrack(trackId);
  const idx = track?.chapters.findIndex((c) => c.id === chapterId) ?? -1;
  if (!track || idx < 0) return null;
  return { track, chapter: track.chapters[idx], prev: track.chapters[idx - 1] ?? null, next: track.chapters[idx + 1] ?? null, idx };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  return { title: data ? `${data.chapter.title} - ${data.track.title}` : "Chapter" };
}

export default async function ChapterPage({ params }: { params: Params }) {
  const data = await load(params);
  if (!data) notFound();
  const { track, chapter, prev, next, idx } = data;
  const counts = chapter.questions.reduce<Record<string, number>>((acc, q) => ({ ...acc, [q.type]: (acc[q.type] ?? 0) + 1 }), {});

  return (
    <div className="container page">
      <div className="layout-2">
        <article className="lesson">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/learn">Learn</Link>
            <Icon name="chevronRight" size={14} />
            <Link href={`/learn/${track.id}`}>{track.title}</Link>
            <Icon name="chevronRight" size={14} />
            <span>Chapter {idx + 1}</span>
          </nav>
          <div className="row wrap" style={{ gap: 8, marginTop: 14 }}>
            <span className={`badge lvl-${chapter.level}`}>{levelLabel(chapter.level)}</span>
            <span className="badge"><Icon name="clock" size={12} /> {chapter.estMinutes} min</span>
            <span className="badge">{chapter.questions.length} questions</span>
          </div>
          <h1 className="page-title" style={{ marginTop: 10 }}>{chapter.title}</h1>
          <p className="muted" style={{ marginTop: 8, fontSize: 18 }}>{chapter.summary}</p>
          {chapter.draft || chapter.applicableFor || chapter.lawAsOf ? (
            <div className={`notice${chapter.draft ? " warn" : ""}`} style={{ marginTop: 16 }} role="note">
              <Icon name="shield" size={18} />
              <div>
                {chapter.applicableFor ? <p><b>Applicable for:</b> {chapter.applicableFor}</p> : null}
                {chapter.lawAsOf ? <p><b>Law as of:</b> {chapter.lawAsOf}</p> : null}
                {chapter.draft ? (
                  <p style={{ marginTop: chapter.applicableFor || chapter.lawAsOf ? 6 : 0 }}>
                    <b>Draft.</b> Not yet reviewed by a subject expert. Verify rates, limits and section numbers against the ICAI study material for your attempt.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: 32 }}>
            {chapter.lesson.map((s, i) => (
              <section key={i} id={`s${i + 1}`} className="lesson-section">
                <h2>{s.heading}</h2>
                <RichText text={s.body} />
                {s.code ? <CodeBlock source={s.code.source} lang={s.code.lang} /> : null}
              </section>
            ))}
          </div>

          <section className="card" style={{ marginTop: 40 }}>
            <h2 className="row" style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>
              <Icon name="lightbulb" size={22} style={{ color: "var(--gold)" }} /> Key points
            </h2>
            <ul className="keypoints">
              {chapter.keyPoints.map((k, i) => (
                <li key={i}>
                  <Icon name="check" size={16} strokeWidth={3} />
                  <span><Inline text={k} /></span>
                </li>
              ))}
            </ul>
          </section>

          {chapter.resources?.length ? (
            <section style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Read more</h2>
              <div className="stack" style={{ gap: 8 }}>
                {chapter.resources.map((r) => (
                  <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="row link" style={{ gap: 8 }}>
                    <Icon name="link" size={16} /> {r.title}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <div style={{ marginTop: 36 }}>
            <StudyActions trackId={track.id} chapterId={chapter.id} />
          </div>

          <nav className="row wrap" style={{ justifyContent: "space-between", marginTop: 32, gap: 12 }} aria-label="Chapter navigation">
            {prev ? (
              <Link href={`/learn/${track.id}/${prev.id}`} className="btn btn-sm btn-ghost">
                <Icon name="chevronLeft" size={16} /> {prev.title}
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/learn/${track.id}/${next.id}`} className="btn btn-sm btn-ghost">
                {next.title} <Icon name="chevronRight" size={16} />
              </Link>
            ) : null}
          </nav>
        </article>

        <aside className="stack">
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>In this chapter</h3>
            <nav className="toc">
              {chapter.lesson.map((s, i) => (
                <a key={i} href={`#s${i + 1}`}>{i + 1}. {s.heading}</a>
              ))}
            </nav>
          </div>
          <div className="card stack" style={{ gap: 8 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Practice set</h3>
            <dl className="kv">
              {counts.mcq ? (<><dt>Multiple choice</dt><dd>{counts.mcq}</dd></>) : null}
              {counts.truefalse ? (<><dt>True or false</dt><dd>{counts.truefalse}</dd></>) : null}
              {counts.multi ? (<><dt>Select all</dt><dd>{counts.multi}</dd></>) : null}
              {counts.fill ? (<><dt>Fill the blank</dt><dd>{counts.fill}</dd></>) : null}
              {counts.numeric ? (<><dt>Calculations</dt><dd>{counts.numeric}</dd></>) : null}
              {counts.practical ? (<><dt>Practical problems</dt><dd>{counts.practical}</dd></>) : null}
              {counts.interview ? (<><dt>{programConfig(programOf(track.area)).terms.nav}</dt><dd>{counts.interview}</dd></>) : null}
            </dl>
            <Link href={`/learn/${track.id}/${chapter.id}/practice`} className="btn btn-block btn-accent" style={{ marginTop: 6 }}>
              <Icon name="bolt" size={18} /> Start practice
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
