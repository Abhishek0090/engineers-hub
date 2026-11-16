# StudyHub

Chapter-wise study and exam prep, Duolingo style. Pick a goal, study a chapter, practice it as a
quiz, keep your streak, and review your mistakes until they stick.

Programs today:

- **Software engineering**: full stack study and interview prep.
- **CA exam prep (ICAI new scheme)**: Foundation, Intermediate and Final, with calculations,
  practical problems, case-based MCQs and theory questions. Law and tax chapters show the attempt
  they are written for (Income-tax Act 2025 from the May 2027 exams) and are marked draft until
  reviewed by a subject expert.

Everything you may want to change is JSON in [src/content](src/content): the site name and programs
(`site.json`), goals, users and one file per track. Add a new program by editing `site.json`; see
[docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md).

Built with Next.js 16 (App Router), React 19 and TypeScript. Content is static JSON today and
switches to MongoDB with one environment variable.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how it is built
- [docs/CURRICULUM.md](docs/CURRICULUM.md): what it covers (generated from the content)
- [docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md): how to add or change content

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Static logins:

| Username | Password | Role |
| --- | --- | --- |
| `abhishek` | `hub@2026` | admin |
| `demo` | `demo1234` | learner |

## Pages

| Route | What it is |
| --- | --- |
| `/` | Landing page with goals, how it works and the full curriculum |
| `/login` | Static login (signed, HttpOnly session cookie) |
| `/learn` | Dashboard: goal picker, streak, XP, daily goal, continue card, track list |
| `/learn/[track]` | Chapter path for one track, grouped Beginner, Intermediate, Advanced |
| `/learn/[track]/[chapter]` | Study page: lesson sections, code, key points, links to docs |
| `/learn/[track]/[chapter]/practice` | Practice session: quiz, interview questions, XP, results |
| `/interview` | Question bank with model answers (interview for software, theory for CA), plus 5-question rounds |
| `/review` | Every question you got wrong, until you answer it right |
| `/profile` | Stats, activity heatmap, daily goal, reset |

## Content

All study material is JSON in [src/content](src/content):

- `tracks/<id>.json`: one file per track (chapters, lessons, key points, questions)
- `goals.json`: learning goals and the ordered track list for each
- `site.json`: site name, programs, areas and per-program wording
- `users.json`: static users (passwords are scrypt hashes)

Question types: `mcq`, `truefalse`, `multi` (select all), `fill` (fill the blank), `interview`
(model answer, self-graded), `numeric` (number within a tolerance) and `practical` (model solution,
self-graded). Lesson text supports paragraphs, `- ` bullets, tables, `` `code` `` and `**bold**`.
Software tracks and CA tracks differ only by `area`; see [docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md).

After editing content, run:

```bash
npm run validate
```

It checks the schema, unique ids, answer indexes and typography. To add a user, hash a password with
`npm run hash-password -- "new-password"` and add an entry to `users.json`.

## Switch to MongoDB

The app reads data through one interface, [src/lib/data/repository.ts](src/lib/data/repository.ts),
with two implementations: `json-repository.ts` and `mongo-repository.ts`.

```bash
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run db:up                # MongoDB 8 in Docker (docker-compose.yml)
npm run db:seed              # copies tracks, goals and users into MongoDB
```

Set `DATA_SOURCE=mongo` in `.env.local` and restart. Collections: `tracks`, `goals`, `users`,
`progress`. In MongoDB mode, progress (XP, streak, mistakes) is saved per user through
`/api/progress`; in JSON mode it stays in the browser's localStorage.

Optional database UI: `docker compose --profile tools up -d mongo-express`, then http://localhost:8081.

## Install as an app

StudyHub is a PWA. On a production server over HTTPS (or `localhost` after `npm run build && npm start`):

- **Chrome, Edge, Android:** use **Install app** in the sidebar, or the install icon in the address bar.
- **iPhone, iPad:** in Safari tap Share, then **Add to Home Screen**.

Pages you have opened work offline. Logging out clears them from the device.

## Share to another laptop

```bash
npm run share
```

Writes `share/setup-software-engineers-hub.mjs` (new machine), `share/sync-software-engineers-hub.mjs`
(update an existing copy) and `share/HOW-TO-SETUP.md`. Each script holds the whole project compressed
and verifies every file after writing.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run validate` | Check content JSON |
| `npm run db:up` / `npm run db:seed` | Start MongoDB / load content into it |
| `npm run hash-password -- "pw"` | Password hash for a user |
| `npm run docs` | Regenerate docs/CURRICULUM.md from the content |
| `npm run share` | Refresh docs, then build the setup and sync scripts |
