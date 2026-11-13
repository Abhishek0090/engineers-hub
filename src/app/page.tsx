import Link from "next/link";

import { FilledIcon, Icon, type IconName } from "@/components/icons";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth/current-user";
import { AREAS, GOAL_ICONS } from "@/lib/catalog";
import { getRepository } from "@/lib/data/repository";

const STEPS: { title: string; text: string; icon: IconName }[] = [
  { title: "Pick a goal", text: "Interview cracking, full stack mastery, frontend, backend or self development. Your path follows the goal.", icon: "target" },
  { title: "Study a chapter", text: "Short lessons with code, key points and links to the official docs. One chapter is 15 to 30 minutes.", icon: "book" },
  { title: "Practice like a game", text: "Multiple choice, true or false, fill the blank, output prediction and interview questions. Earn XP, keep the streak.", icon: "bolt" },
  { title: "Fix your mistakes", text: "Every wrong answer goes to your review queue until you get it right. Then run mock interviews from the question bank.", icon: "refresh" },
];

const STACK = [
  "HTML", "CSS", "JavaScript", "TypeScript", "React 19", "Next.js 16", "Tailwind CSS", "Redux Toolkit", "Zustand", "TanStack Query",
  "Vitest", "Playwright", "Node.js", "Express", "REST", "GraphQL", "WebSockets", "JWT", "OAuth 2.0", "MongoDB", "Mongoose",
  "PostgreSQL", "Prisma", "Drizzle", "Redis", "Docker", "GitHub Actions", "Kubernetes", "AWS", "System design", "DSA", "Git",
];

export default async function LandingPage() {
  const [session, repo] = await Promise.all([getSession(), getRepository()]);
  const [tracks, goals, interview] = await Promise.all([repo.listTracks(), repo.listGoals(), repo.listInterviewQuestions()]);
  const chapterCount = tracks.reduce((n, t) => n + t.chapters.length, 0);
  const questionCount = tracks.reduce((n, t) => n + t.questionCount, 0);
  const startHref = session ? "/learn" : "/login";

  return (
    <>
      <SiteHeader signedIn={!!session} />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <span className="eyebrow">Full stack prep, one chapter a day</span>
              <h1 style={{ marginTop: 14 }}>
                Become the engineer <span className="hl">who gets the offer.</span>
              </h1>
              <p className="hero-lede">
                Chapter-wise lessons and {questionCount.toLocaleString("en-US")}+ practice questions for Next.js, React, Node.js, MongoDB, PostgreSQL,
                Prisma, Drizzle, Docker and more. Study, practice, keep your streak and walk into interviews prepared.
              </p>
              <div className="hero-cta">
                <Link href={startHref} className="btn btn-lg btn-accent">
                  Start learning <Icon name="arrowRight" size={18} />
                </Link>
                <a href="#curriculum" className="btn btn-lg btn-ghost">
                  See the curriculum
                </a>
              </div>
              <p className="hero-note">Beginner to advanced. Free, private, works on laptop and phone.</p>
            </div>

            <div className="mock" aria-hidden="true">
              <div className="mock-card">
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
                  <span className="row" style={{ gap: 8 }}>
                    <span className="track-badge sm" style={{ ["--tc" as string]: "#64748b" }}>NX</span>
                    <b>Next.js</b>
                  </span>
                  <span className="row" style={{ gap: 14, fontWeight: 700 }}>
                    <span className="row" style={{ gap: 4, color: "var(--flame)" }}>
                      <FilledIcon name="flame" size={18} /> 12
                    </span>
                    <span className="row" style={{ gap: 4, color: "var(--gold)" }}>
                      <FilledIcon name="bolt" size={18} /> 1,240
                    </span>
                  </span>
                </div>
                <div className="mock-path">
                  <div className="mock-node"><Icon name="check" size={26} strokeWidth={3} /></div>
                  <div className="mock-node" style={{ transform: "translateX(40px)" }}><Icon name="check" size={26} strokeWidth={3} /></div>
                  <div className="mock-node cur" style={{ transform: "translateX(10px)" }}><FilledIcon name="star" size={24} /></div>
                  <div className="mock-node off" style={{ transform: "translateX(-36px)" }}><Icon name="book" size={22} /></div>
                </div>
              </div>
              <div className="mock-card">
                <div className="q-type" style={{ fontSize: 11 }}>Multiple choice</div>
                <p style={{ fontWeight: 600, margin: "6px 0 12px" }}>Where can you call a Server Action from?</p>
                <div className="stack" style={{ gap: 8 }}>
                  <div className="mock-opt">Only from Route Handlers</div>
                  <div className="mock-opt right">Forms and Client Components</div>
                  <div className="mock-opt">Only inside proxy.ts</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container" aria-label="Content in numbers">
          <div className="stats-strip">
            <div className="stat"><b>{tracks.length}</b><span>Tracks</span></div>
            <div className="stat"><b>{chapterCount}</b><span>Chapters</span></div>
            <div className="stat"><b>{questionCount.toLocaleString("en-US")}</b><span>Practice questions</span></div>
            <div className="stat"><b>{interview.length.toLocaleString("en-US")}</b><span>Interview questions with answers</span></div>
          </div>
        </section>

        <section id="goals" className="section container">
          <div className="section-head">
            <span className="eyebrow">Choose your goal</span>
            <h2 className="section-title" style={{ marginTop: 8 }}>Prep for what you actually want</h2>
            <p>Each goal is an ordered path through the tracks. Switch any time; your progress stays.</p>
          </div>
          <div className="grid grid-3">
            {goals.map((g) => (
              <div key={g.id} className="card">
                <span className="feature-icon"><Icon name={GOAL_ICONS[g.icon] ?? "target"} size={24} /></span>
                <h3 style={{ fontSize: 20, fontWeight: 700 }}>{g.title}</h3>
                <p className="muted" style={{ marginTop: 6 }}>{g.tagline}</p>
                <p className="faint" style={{ marginTop: 12, fontSize: 14, fontWeight: 700 }}>
                  {g.trackIds.length} tracks, {g.dailyGoalXp} XP a day
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="section container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2 className="section-title" style={{ marginTop: 8 }}>Small steps, every day</h2>
            <p>The same loop that makes language apps stick, applied to software engineering.</p>
          </div>
          <div className="grid grid-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}>
            {STEPS.map((s, i) => (
              <div key={s.title} className="card">
                <span className="step-num">{i + 1}</span>
                <h3 style={{ fontSize: 18, fontWeight: 700 }} className="row">
                  <Icon name={s.icon} size={18} /> {s.title}
                </h3>
                <p className="muted" style={{ marginTop: 8 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="curriculum" className="section container">
          <div className="section-head">
            <span className="eyebrow">Curriculum</span>
            <h2 className="section-title" style={{ marginTop: 8 }}>Everything a full stack engineer is asked</h2>
            <p>Every track runs from beginner to advanced, chapter by chapter.</p>
          </div>
          {AREAS.map((area) => {
            const list = tracks.filter((t) => t.area === area.id);
            if (!list.length) return null;
            return (
              <div key={area.id} className="area-block">
                <div className="area-title">
                  <Icon name={area.icon} size={18} /> {area.label}
                </div>
                <div className="grid grid-auto">
                  {list.map((t) => (
                    <Link key={t.id} href={session ? `/learn/${t.id}` : "/login"} className="card card-link" style={{ padding: 16 }}>
                      <div className="track-row">
                        <span className="track-badge" style={{ ["--tc" as string]: t.color }}>{t.icon}</span>
                        <div className="grow">
                          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{t.title}</h3>
                          <p className="faint" style={{ fontSize: 13, fontWeight: 700 }}>
                            {t.chapters.length} chapters, {t.questionCount} questions
                          </p>
                        </div>
                      </div>
                      <p className="muted" style={{ fontSize: 14, marginTop: 10 }}>{t.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section className="section container" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <span className="eyebrow">Stack covered</span>
            <h2 className="section-title" style={{ marginTop: 8 }}>From the browser to production</h2>
          </div>
          <div className="tech-cloud">
            {STACK.map((s) => (
              <span key={s} className="chip">{s}</span>
            ))}
          </div>
        </section>

        <section className="container" style={{ paddingBottom: 72 }}>
          <div className="cta-band">
            <h2 className="section-title">Your next chapter is waiting</h2>
            <p>Ten minutes a day adds up. Start with a goal and the app tells you what to learn next.</p>
            <Link href={startHref} className="btn btn-lg btn-accent">
              {session ? "Go to dashboard" : "Log in and start"} <Icon name="arrowRight" size={18} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter dataSource={repo.kind} />
    </>
  );
}
