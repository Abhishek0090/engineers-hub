# How Software Engineers Hub is built

This document explains the moving parts: the stack, the folders, how a request flows, how login and
progress work, and how the data layer switches from static JSON to MongoDB.

For what the app teaches, see [CURRICULUM.md](CURRICULUM.md). For adding or editing lessons and
questions, see [CONTENT-GUIDE.md](CONTENT-GUIDE.md).

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16, App Router, Turbopack | Server Components render lessons on the server; Route Handlers give a small API |
| UI | React 19, TypeScript (strict) | Typed content and progress models end to end |
| Styling | One global stylesheet, CSS custom properties | No CSS framework to install; dark and light themes through tokens |
| Fonts | Inter and JetBrains Mono via `next/font/google` | Self-hosted at build time, no browser requests to Google |
| Data | JSON files today, MongoDB 8 when `DATA_SOURCE=mongo` | Start without a database, upgrade without touching pages |
| Auth | Signed HttpOnly cookie (HMAC-SHA256), scrypt password hashes | No auth library; works in the proxy and in route handlers |
| Database tooling | Docker Compose (`mongo:8`, optional `mongo-express`) | One command to get a local database |

Runtime dependencies are only `next`, `react`, `react-dom` and `mongodb`. The MongoDB driver is
imported lazily, so it is never loaded in JSON mode.

## Folder layout

```text
src/
  app/                      Routes (App Router)
    page.tsx                Landing page (public)
    login/                  Static login page and form
    (app)/                  Signed-in area; the group's layout adds the shell and progress
      layout.tsx            requireSession() + ProgressProvider + AppShell
      learn/                Dashboard, track path, chapter study page, practice session
      interview/            Interview bank and mock interview rounds
      review/               Mistakes queue and review session
      profile/              Stats, activity heatmap, settings
    api/
      auth/login, logout    Sign in and out (sets or clears the session cookie)
      progress              GET/PUT learner progress (stored only in MongoDB mode)
      questions             POST ids -> questions (used by the review session)
    globals.css             Design tokens and every component style
    layout.tsx              Root layout: fonts, theme script, metadata
  components/               Shared UI (practice player, cards, icons, shell, theme toggle)
  content/                  The study material: tracks/*.json, goals.json, users.json
  lib/
    types.ts                Content, user and progress types
    catalog.ts              Areas, levels, site name
    progress.ts             XP, streak, mastery and sanitizing (pure functions)
    auth/                   Session signing, password check, current-user helpers
    data/                   Repository interface plus JSON and MongoDB implementations
  proxy.ts                  Next.js 16 proxy (formerly middleware): guards signed-in routes
scripts/
  validate-content.mjs      Schema and typography checks for the content JSON
  seed-mongo.mjs            Copies tracks, goals and users into MongoDB
  hash-password.mjs         Creates a password hash for users.json
  build-docs.mjs            Regenerates docs/CURRICULUM.md from the content
  make-share.mjs            Builds the setup and sync scripts in share/
docs/                       This documentation
docker-compose.yml          Local MongoDB
```

## Request flow

```text
Browser
  -> proxy.ts                verifies the session cookie for /learn, /interview, /review,
                             /profile and the progress/questions APIs; redirects to /login
  -> (app)/layout.tsx        requireSession() again (defence in depth), wraps the page in
                             ProgressProvider and AppShell
  -> page.tsx (server)       getRepository() -> listTracks() / getTrack() / ...
  -> client component        dashboard, track path, practice player read and update progress
```

Pages are rendered on demand (`ƒ` in the build output) because they read the session cookie and,
in MongoDB mode, live data.

## Data layer

All reads go through one interface, [src/lib/data/repository.ts](../src/lib/data/repository.ts):

```ts
interface Repository {
  kind: "json" | "mongo";
  persistsProgress: boolean;
  listTracks(): Promise<TrackSummary[]>;
  getTrack(trackId: string): Promise<Track | null>;
  listGoals(): Promise<Goal[]>;
  listInterviewQuestions(): Promise<InterviewItem[]>;
  getQuestions(ids: string[]): Promise<LocatedQuestion[]>;
  findUserByUsername(username: string): Promise<UserRecord | null>;
  getProgress(userId: string): Promise<Progress | null>;
  saveProgress(userId: string, progress: Progress): Promise<void>;
}
```

`getRepository()` picks the implementation from `DATA_SOURCE`:

| `DATA_SOURCE` | Implementation | Content | Users | Progress |
| --- | --- | --- | --- | --- |
| `json` (default) | `json-repository.ts` | `src/content/tracks/*.json` | `src/content/users.json` | Browser localStorage only |
| `mongo` | `mongo-repository.ts` | `tracks` collection | `users` collection | `progress` collection, one document per user |

Shared logic (track summaries, the interview list, the "most asked" selection) lives in
`derive.ts`, so both implementations return identical shapes.

In development the JSON repository re-reads files on every request, so content edits show up on
refresh. In production it caches them for the life of the server process.

### Switching to MongoDB

```bash
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run db:up                # starts mongo:8 on localhost:27017
npm run db:seed              # upserts tracks, goals, users; removes deleted tracks/goals
```

Set `DATA_SOURCE=mongo` in `.env.local` and restart. Seeding is safe to repeat and never touches the
`progress` collection.

### Adding another database later

Write a new file in `src/lib/data/` that returns a `Repository` (PostgreSQL with Prisma or Drizzle,
for example), then add a branch for it in `getRepository()`. No page or component changes.

## Authentication

- **Users:** `users.json` (or the `users` collection) holds `id`, `username`, `name`, `role` and
  `passwordHash`. Hashes have the form `scrypt$<salt>$<hash>`; create one with
  `npm run hash-password -- "password"`.
- **Login:** `POST /api/auth/login` checks the hash with a timing-safe compare and sets
  `seh_session`: an HttpOnly, SameSite=Lax cookie (Secure in production) that lasts 30 days.
- **Cookie format:** `base64url(payload).base64url(HMAC-SHA256(payload, AUTH_SECRET))`. The payload
  holds the user id, username, name, role and expiry. Verification uses Web Crypto, so it runs in
  `proxy.ts` and in route handlers alike.
- **Logout:** `POST /api/auth/logout` clears the cookie.
- **Production:** set `AUTH_SECRET` to a long random string. Without it a development secret is used
  and a warning is logged.

## Progress and gamification

Progress is one object per user (`Progress` in `types.ts`):

| Field | Meaning |
| --- | --- |
| `xp` | Total XP |
| `streak` | Current count, last active day, best streak |
| `history` | XP per day (`YYYY-MM-DD`), drives the week chart and heatmap |
| `chapters` | Per chapter: best score, attempts, studied flag |
| `mistakes` | Question ids answered wrong and not yet fixed |
| `practiced` | Interview questions marked as practiced |
| `goalId`, `dailyGoalXp` | Selected goal and daily target |

Rules live in [src/lib/progress.ts](../src/lib/progress.ts) as pure functions:

- 10 XP per correct answer, 5 XP for "Partly" on an interview question, +10 for a perfect session,
  5 XP for marking a lesson as studied.
- The streak grows when you earn XP on the day after your last active day and resets after a missed day.
- A chapter is **mastered** at a best practice score of 80% or more.
- Levels need 100 XP, then 150, 200 and so on.

`ProgressProvider` keeps progress in localStorage under `seh:progress:<userId>`. When
`/api/progress` reports `persist: true` (MongoDB mode), it loads the server copy (the newer
`updatedAt` wins) and saves changes back with a 600 ms debounce. The API runs every body through
`sanitizeProgress()` before storing it.

## Practice player

[src/components/practice-player.tsx](../src/components/practice-player.tsx) runs every session:
chapter practice, review and mock interviews.

- **Modes:** full set, quick round (8 quiz + 2 interview), quiz only, interview only.
- **Shuffling:** questions and answer options are shuffled when the session starts. It happens in the
  browser after mount, so server and client HTML match. Options containing "all of the above" and
  similar keep their order.
- **Grading:** `mcq`, `truefalse` and `multi` compare indexes. `fill` compares normalized text against
  the `accept` list. `interview` reveals the model answer and the learner rates it (Missed, Partly,
  Nailed it).
- **Keyboard:** 1-6 picks an option, Enter checks and continues.
- **End of session:** `recordSession()` adds XP, updates the chapter score, adds wrong answers to
  `mistakes` and removes the ones answered right.

## UI and theming

- Colors, radii and shadows are CSS custom properties on `:root`. Dark is the default; light comes
  from `prefers-color-scheme` or the theme toggle, saved under `seh:theme`. An inline script in the
  root layout applies the saved theme before first paint.
- The brand is a blue-to-red gradient (`--grad`) used on primary buttons, the logo, progress bars,
  the current path node and highlights.
- Buttons are "pressable": a solid bottom edge that collapses on `:active`.
- Layout is mobile first: bottom navigation under 1024px, a sidebar above it. Grid columns use
  `minmax(0, 1fr)` so the page never scrolls sideways.
- Icons are inline SVG paths in `components/icons.tsx`; there is no icon library.

## Quality checks

| Command | Checks |
| --- | --- |
| `npm run typecheck` | TypeScript, strict mode |
| `npm run lint` | ESLint with `eslint-config-next` (Core Web Vitals, TypeScript, React Compiler rules) |
| `npm run validate` | Content schema, unique ids, answer indexes, no smart quotes or invisible characters |
| `npm run build` | Production build |

## Sharing the project

`npm run share` runs `scripts/build-docs.mjs` (refreshing [CURRICULUM.md](CURRICULUM.md)) and then
packs every project file, including `docs/`, content and `package-lock.json`, into
`share/setup-software-engineers-hub.mjs` and `share/sync-software-engineers-hub.mjs`. The files are
gzip and base64 in comment lines at the end of each script, with a SHA-256 checksum. A paste that
gets cut off is detected and reported instead of producing a broken project. `node_modules`, `.next`,
`.env` files and `share/` itself are left out.
