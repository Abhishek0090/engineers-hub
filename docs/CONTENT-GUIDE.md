# Content guide

How to add or change tracks, chapters, questions, goals and users. All content is JSON under
[src/content](../src/content). After any change run `npm run validate`.

## Files

| File | Holds |
| --- | --- |
| `src/content/tracks/<id>.json` | One track: metadata plus its chapters, lessons and questions |
| `src/content/goals.json` | Learning goals and the ordered list of track ids for each |
| `src/content/users.json` | Static logins (until the database login is used) |
| `src/content/site.json` | Site name, tagline, author, programs (with `idPrefix`, color, icon and wording in `terms`) and areas |

### Add a program

1. Add an entry to `programs` in `site.json`: `id`, `idPrefix` (for example `"gate-"`), `label`,
   `short`, `icon`, `color`, `blurb`, `heroLine` and `terms` (copy an existing program's terms
   and reword them).
2. Add its `areas` with `"program": "<id>"`.
3. Add track files whose ids start with the prefix, and goals with `"program": "<id>"` and ids
   starting with the prefix.
4. Run `npm run validate`. The program appears on the landing page, goal picker and question bank.

A new track file shows up in the app on the next refresh. A goal that lists a track id with no file
yet hides that track until the file exists.

## Track

```json
{
  "id": "react",
  "title": "React",
  "area": "frontend",
  "order": 13,
  "icon": "RE",
  "color": "#06b6d4",
  "description": "One or two sentences.",
  "chapters": []
}
```

| Field | Rules |
| --- | --- |
| `id` | Lowercase, matches the file name. CA track ids start with `ca-` (the validator enforces it; the app uses the prefix for CA wording). |
| `area` | Software: `fundamentals`, `frontend`, `backend`, `database`, `devops`, `career`. CA: `ca-foundation`, `ca-inter`, `ca-final`. The area decides the program. |
| `order` | Sort position within all tracks |
| `icon` | 2-3 characters shown on the track badge |
| `color` | `#rrggbb` badge and header color |

## Chapter

```json
{
  "id": "react-03-state",
  "title": "State and Events",
  "level": "beginner",
  "summary": "One sentence.",
  "estMinutes": 25,
  "lesson": [{ "heading": "...", "body": "...", "code": { "lang": "tsx", "source": "..." } }],
  "keyPoints": ["...", "..."],
  "questions": [],
  "resources": [{ "title": "React docs: State", "url": "https://react.dev/learn/state-a-components-memory" }]
}
```

- `id` is globally unique: track id, a two-digit number, a slug.
- `level` is `beginner`, `intermediate` or `advanced`. Chapters are grouped by level on the path, in
  file order.
- `lesson` needs at least 2 sections; `code` is optional.
- `keyPoints` needs at least 2 items.
- `resources` is optional; URLs must be `https://`.
- Aim for 7-9 chapters per track and 12-16 questions per chapter.

Optional chapter fields, used by CA content:

| Field | Meaning |
| --- | --- |
| `applicableFor` | Exam attempts the chapter is written for, e.g. `"May 2027 onward"` |
| `lawAsOf` | Law or standards version, e.g. `"Income-tax Act 2025 as amended by Finance Act 2026"` |
| `draft` | `true` until a subject expert has reviewed it; the study page shows a warning |
| `cases` | `[{ "id", "title", "body" }]` case studies; questions point at one with `caseId` |

A case id is globally unique (`<chapterId>-case1`) and needs at least one question. Put law,
tax, audit and standards chapters on `applicableFor`, `lawAsOf` and `draft: true`; remove
`draft` only after review.

### Lesson text format

`body`, `keyPoints`, prompts, explanations and model answers use a small format:

- A blank line (`\n\n`) starts a new paragraph.
- Lines starting with `- ` are bullets.
- `` `code` `` for inline code, `**bold**` for emphasis.
- Consecutive lines starting with `|` form a table. The first row is the header and a
  `| --- | --- |` row is skipped. Numeric cells (`9,00,000`, `(75,000)`, `12.5%`) are
  right-aligned.

## Questions

Every question has a unique `id` and a `prompt`. It can also have `code` (a snippet shown under the
prompt), `data` (problem data in the lesson text format, tables included, shown under the prompt),
`caseId` (a case of the same chapter, shown above the prompt), `level` (overrides the chapter
level) and `top` (see below).

| Type | Extra fields | Graded by |
| --- | --- | --- |
| `mcq` | `options` (2-6), `answer` (index), `explanation` | Exact option |
| `truefalse` | `answer` (`true`/`false`), `explanation` | Exact value |
| `multi` | `options` (3+), `answers` (indexes), `explanation` | All correct options and no others |
| `fill` | `accept` (list of accepted answers), `explanation` | Case-insensitive match after trimming quotes, `;` and `()` |
| `interview` | `answer` (model answer) | Learner self-rates against the model answer. Shown as "Theory question" in CA tracks. |
| `numeric` | `answer` (number), optional `tolerance` (absolute, default 0.1% of the answer), `unit` (e.g. `₹`, `%`), `explanation` | Parsed number within the tolerance |
| `practical` | `answer` (model solution, tables allowed) | Learner self-rates against the model solution |

Examples:

```json
{ "id": "react-03-q01", "type": "mcq", "prompt": "What does this render after one click?",
  "code": "const [n, setN] = useState(0);\n...", "options": ["0", "1", "2"], "answer": 1,
  "explanation": "State updates are batched and n is a snapshot..." }

{ "id": "react-03-q07", "type": "fill", "prompt": "Fill the blank: the hook that stores state is ___.",
  "accept": ["useState", "React.useState"], "explanation": "..." }

{ "id": "react-03-q10", "type": "interview", "prompt": "Why should state be treated as immutable?",
  "answer": "React compares references to decide what changed...", "level": "intermediate", "top": true }

{ "id": "ca-i-income-tax-04-q09", "type": "numeric", "prompt": "Compute the taxable salary. Round to the nearest rupee.",
  "data": "| Particulars | ₹ |\n| --- | --- |\n| Basic salary | 9,00,000 |", "answer": 825000, "tolerance": 1, "unit": "₹",
  "explanation": "9,00,000 less standard deduction of 75,000..." }
```

Options are shuffled in practice, so never write "the option above". Options containing "all of the
above", "none of the above" and similar keep their order.

### Most asked questions

Every track page ends with **Most asked questions**: up to 15 interview questions. Questions with
`"top": true` come first and get a "Most asked" badge. The rest of the list is filled round-robin
across chapters (the first interview question of each chapter, then the second, and so on) so it
spans beginner to advanced. Flag the questions candidates hear in almost every interview.

## Goals

```json
{
  "id": "interview",
  "title": "Crack the interview",
  "tagline": "Short line for cards.",
  "description": "Longer text.",
  "icon": "target",
  "dailyGoalXp": 50,
  "trackIds": ["javascript", "typescript", "react"]
}
```

`icon` is one of `target`, `layers`, `layout`, `server`, `sprout`, `calculator`, `scale`, `cap`.
`trackIds` is the path order on the dashboard. `program` is `software` (default) or `ca`; give CA
goals an id starting with `ca-` so the question bank opens on the CA program for those learners.

## Users

```bash
npm run hash-password -- "new-password"
```

Add the printed hash to a new entry in `users.json` (`id`, `username`, `name`, `role` of `admin` or
`learner`, `passwordHash`). In MongoDB mode run `npm run db:seed` afterwards.

## Writing style

- Straight quotes and hyphens only. The validator rejects smart quotes, en/em dashes, the ellipsis
  character and zero-width characters.
- Explanations say why the answer is right, not only what it is.
- Model answers read like a strong candidate speaking: 3-8 sentences or bullets.
- Facts should be current. Name versions where behavior changed (React 19, Next.js 16, Tailwind v4).
- CA: use `₹` and Indian digit grouping (12,50,000). State the rounding a `numeric` answer expects.
  Write original material; do not copy ICAI study material, RTPs, MTPs or past papers.

## After editing

```bash
npm run validate     # must end with "Content OK"
npm run db:seed      # only in MongoDB mode
npm run share        # refreshes docs/CURRICULUM.md and the setup/sync scripts
```
