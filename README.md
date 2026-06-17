# Rule Wars

Group voting on C# coding standards. Create a group, invite your teammates, browse Microsoft's official C# **code style**
(`IDExxxx`) and **code quality** (`CAxxxx`) analyzer rules, vote on each, and generate a
consensus `.editorconfig` you can drop into any C# project.

- **Vote Yes** to enable a rule and choose a severity (`suggestion` / `warning` / `error`).
- **Vote No** to leave a rule off (maps to `none`).
- Your group's votes aggregate into a generated `.editorconfig`:
  majority Yes enables a rule, and the most-voted severity wins.

Each group is private — votes, results, and the generated `.editorconfig` are scoped to the group. One ballot per browser per group.

## Tech stack

- [Nuxt 4](https://nuxt.com) (Vue 3, SSR) + [Nuxt UI](https://ui.nuxt.com)
- [Drizzle ORM](https://orm.drizzle.team) + libSQL/SQLite (`@libsql/client`)
- [Shiki](https://shiki.style) for C# example highlighting
- [Zod](https://zod.dev) for request + dataset validation

## Project structure

```
app/                    # Nuxt app (pages, components, composables, utils)
  components/           # RuleCard, VoteControl, CodeBlock, TallyBar, SeverityBadge
  composables/          # useVoting (shared state + optimistic updates), useHighlighter
  pages/                # index, rules, rules/[id], results, about
server/
  api/rules/            # GET /api/rules, GET /api/rules/:id
  api/votes/            # GET summary, GET me, POST (cast/update a vote)
  api/editorconfig.get  # generated .editorconfig (?download=true, ?includeUnvoted=true)
  data/rules.ts         # merges the full catalog with curated overrides
  data/rules.generated.json  # full CA + IDE catalog (auto-generated)
  data/curated.ts       # hand-curated rules (rich descriptions + examples)
  db/                   # Drizzle schema + connection
shared/
  types/rule.ts         # shared types (Rule, Severity, RuleTally, ...)
  utils/consensus.ts    # vote -> consensus computation
  utils/editorconfig.ts # consensus -> .editorconfig text
```

The dataset combines two sources, validated with Zod on server startup:

- **`rules.generated.json`** — the full Microsoft catalog (every `CA` and `IDE` rule),
  generated from the official Microsoft Learn rule index pages via
  `npm run rules:generate`.
- **`curated.ts`** — hand-curated rules with rich descriptions, rationale, C# examples,
  and preferred `.editorconfig` option values. These override the generated entries by id.

Imported rules are further **enriched** from the individual Microsoft docs pages
(overview/description, cause, how-to-fix, when-to-suppress, configurable option tables,
and a C# example) by `scripts/enrich-rules.mjs`, which reads a local clone of the docs.

To refresh the catalog from Microsoft's docs:

```bash
# 1. List of rules (ids/titles/categories) from the docs index pages
npm run rules:generate

# 2. Enrich each rule from a local clone of the docs at ./code-analysis
#    (clone github.com/dotnet/docs -> docs/fundamentals/code-analysis into ./code-analysis)
npm run rules:enrich
```

## Setup

```bash
npm install
```

Optionally copy the env example (the default works out of the box with a local SQLite file):

```bash
cp .env.example .env
```

## Development

```bash
npm run dev
```

App runs on `http://localhost:3000`. The SQLite schema is created automatically on first
run under `.data/rule-wars.db`.

## Production

```bash
npm run build
npm run preview
```

For a hosted database, set `DATABASE_URL` (and `DATABASE_AUTH_TOKEN`) to a libSQL/Turso
endpoint. `drizzle.config.ts` is provided for generating/applying migrations with
`drizzle-kit` when not relying on the dev-time auto-create.

## API

All voting is scoped to a **group**. Create a group (you become its admin via a
password), share the invite link, and teammates join by entering their name. Votes,
results, and the generated `.editorconfig` are private to each group.

Set `ADMIN_SECRET` to a long random value in production — it signs the group admin cookies.

| Method | Route | Description |
| ------ | ----- | ----------- |
| GET | `/api/rules` | All rules in the dataset |
| GET | `/api/rules/:id` | A single rule |
| POST | `/api/groups` | Create a group `{ name, displayName, password }` (creator becomes admin) |
| GET | `/api/groups/:id` | Group context (name, members, my membership, `isAdmin`) |
| GET | `/api/groups/by-invite/:token` | Public group info for the join screen |
| POST | `/api/groups/by-invite/:token/join` | Join a group `{ name }` |
| POST | `/api/groups/:id/admin` | Unlock admin with the group `{ password }` |
| PATCH | `/api/groups/:id` | Rename the group (admin) `{ name }` |
| DELETE | `/api/groups/:id/votes` | Clear the group's votes (admin) |
| GET | `/api/groups/:id/members` | Group roster |
| GET | `/api/votes/summary?groupId=` | Per-rule tallies + consensus for a group |
| GET | `/api/votes/me?groupId=` | The current member's votes |
| POST | `/api/votes` | Cast/update a vote `{ groupId, ruleId, vote, severity? }` |
| GET | `/api/editorconfig?groupId=` | Generated `.editorconfig` (`?download=true`, `?includeUnvoted=true`, `?useMsDefaults=true`) |
