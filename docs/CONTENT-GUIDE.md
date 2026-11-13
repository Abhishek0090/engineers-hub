# Content guide

How to add or change tracks, chapters, questions, goals and users. All content is JSON under
[src/content](../src/content). After any change run `npm run validate`.

## Files

| File | Holds |
| --- | --- |
| `src/content/tracks/<id>.json` | One track: metadata plus its chapters, lessons and questions |
| `src/content/goals.json` | Learning goals and the ordered list of track ids for each |
| `src/content/users.json` | Static logins (until the database login is used) |

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
| `id` | Lowercase, matches the file name |
| `area` | `fundamentals`, `frontend`, `backend`, `database`, `devops` or `career` |
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

### Lesson text format

`body`, `keyPoints`, prompts, explanations and model answers use a small format:

- A blank line (`\n\n`) starts a new paragraph.
- Lines starting with `- ` are bullets.
- `` `code` `` for inline code, `**bold**` for emphasis.

## Questions

Every question has a unique `id` and a `prompt`. It can also have `code` (a snippet shown under the
prompt), `level` (overrides the chapter level) and `top` (see below).

| Type | Extra fields | Graded by |
| --- | --- | --- |
| `mcq` | `options` (2-6), `answer` (index), `explanation` | Exact option |
| `truefalse` | `answer` (`true`/`false`), `explanation` | Exact value |
| `multi` | `options` (3+), `answers` (indexes), `explanation` | All correct options and no others |
| `fill` | `accept` (list of accepted answers), `explanation` | Case-insensitive match after trimming quotes, `;` and `()` |
| `interview` | `answer` (model answer) | Learner self-rates against the model answer |

Examples:

```json
{ "id": "react-03-q01", "type": "mcq", "prompt": "What does this render after one click?",
  "code": "const [n, setN] = useState(0);\n...", "options": ["0", "1", "2"], "answer": 1,
  "explanation": "State updates are batched and n is a snapshot..." }

{ "id": "react-03-q07", "type": "fill", "prompt": "Fill the blank: the hook that stores state is ___.",
  "accept": ["useState", "React.useState"], "explanation": "..." }

{ "id": "react-03-q10", "type": "interview", "prompt": "Why should state be treated as immutable?",
  "answer": "React compares references to decide what changed...", "level": "intermediate", "top": true }
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

`icon` is one of `target`, `layers`, `layout`, `server`, `sprout`. `trackIds` is the path order on
the dashboard.

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

## After editing

```bash
npm run validate     # must end with "Content OK"
npm run db:seed      # only in MongoDB mode
npm run share        # refreshes docs/CURRICULUM.md and the setup/sync scripts
```
