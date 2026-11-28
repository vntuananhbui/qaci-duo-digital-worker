# AGENTS.md

Guidance for coding agents (Claude Code, Codex, Cursor and others) working in this repository. Humans start with
[README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md); the field reference is [FORMAT.md](FORMAT.md).

## What this repository is

The source of the Digital Workers that the QACI Duo app installs. Content is Markdown: a folder per bot, `workers/<id>/` (its
`WORKER.md` and the skills only it carries, `workers/<id>/skills/<name>/SKILL.md`), and `skills/<name>/SKILL.md` for a
capability several workers share. A merge runs `.github/workflows/publish.yml`, which builds `dist/` and
force-pushes it: `dev` to the `library-dev` branch (read by the dev QACI Duo), `main` to the `library` branch (read
by production). The app reads only those branches (`catalog.json`, `packages/<id>.json`, `skills/<name>/SKILL.md`).
Pull requests target `dev`; a code owner promotes `dev` to `main`. A change on `main` reaches every user within
minutes: treat a merge to `main` as a release.

## Layout

| Path | What it is |
|---|---|
| `workers/<id>/WORKER.md` | One Digital Worker: YAML frontmatter (identity, `release`, `apps`, `playbooks`, `skills`, `agents[]` with `soul`, …) and a body with `## Mission`, `## Working rules`, `## Completion rule` |
| `workers/<id>/skills/<name>/` | A skill only this worker carries: `SKILL.md`, `benchmark.yml` (cases, CONTRIBUTING.md "Benchmark a skill"), `runs/{local,dev}.json` (what a QACI Duo answered, bound by SHA-256 to the SKILL.md and benchmark.yml it ran with) |
| `skills/<name>/` | The same files for a skill two or more workers carry (or none yet). Move a skill here when a second worker needs it; names are unique across both places |
| `REVIEW_CHECKLIST.md` | The standard every pull request is reviewed against |
| `templates/` | The starting files for contributors; they must stay valid (CI checks them) |
| `scripts/lib.mjs` | **Source of truth** for every rule: validators, package builder, catalog, allowed files, secret scan |
| `scripts/validate.mjs`, `scripts/build.mjs` | `npm test` and `npm run build` entry points |
| `scripts/benchmark.mjs`, `scripts/benchmark-lib.mjs` | Benchmark `init` / `check` / `judge` (LLM judge), run by `.github/workflows/benchmark.yml` |
| `scripts/import-from-qaci-duo.mjs` | One-off porter from the app's `docs/playbooks/*.json` |
| `tests/validate.test.mjs` | Node test runner tests for `lib.mjs` |
| `schema/*.schema.json` | JSON Schema mirror of `lib.mjs`, for editors only. If it disagrees with `lib.mjs`, the schema is wrong |
| `app/`, `components/`, `lib/` | The read-only Next.js browsing site (`npm run site:dev`). Not part of CI or the library |
| `dist/` | Build output, git-ignored. Never commit it; never edit the `library` branch by hand |

CI rejects any file outside the allowed layout (`ALLOWED_FILES` in `scripts/lib.mjs`). A helper script cannot sit
next to a `SKILL.md`: put it inline in the skill as a code block the bot saves and runs.

## Commands

```sh
npm ci --ignore-scripts
npm test            # validate every worker and playbook, then run the unit tests; must pass before any commit
npm run build       # write dist/ (catalog.json, packages/<id>.json and .md, teams/, skills/)
npm run typecheck   # only when you touch app/, components/ or lib/
node scripts/benchmark.mjs check --base origin/dev --env any   # every changed skill has a valid, current benchmark run
```

## Rules the validator enforces

- **SKILL.md frontmatter is one line per field.** No YAML lists or multi-line values; comma-separate list items and
  double-quote a value containing `": "`. Required: `name` (= folder name), `title` (≤100), `description` (≤300
  characters, one sentence), `triggers` (1–30 phrases), `license`, `author`. Optional: `tags` (≤8), `compatibility`.
  Unknown fields fail.
- **SKILL.md size:** the body at most 24,000 characters when carried as a playbook; the whole file at most 256 KB.
  Reviewers (not the validator) also expect the sections `# Title`, `## When to use` (with a **Not for:** line),
  `## Inputs`, `## Procedure`, `## Output`, `## Quality checklist`, `## Guardrails`, `## Example`.
- **Worker:** `id` = file name, semantic `release`, `tagline` ≤160, `description` ≤2,000, `soul` <24,000 bytes,
  at least one `playbooks` or `skills` entry, every name must exist as the worker's own `workers/<id>/skills/<name>/SKILL.md` or a shared
  `skills/<name>/SKILL.md`; a worker may not carry another worker's own skill, and a skill in a worker's folder must be
  carried by that worker.
- **No secrets or tricks** in any tracked file: tokens, keys, long base64-like strings, piping a download into a
  shell, invisible Unicode. Apps are declared by `slug` only; credentials live in the user's app connections.

## How the app uses what you write

Knowing this decides how to write a skill. The relevant app code is `server/installed-playbooks.ts` and
`server/skills.ts` in the `qaci-duo` repository.

- **`playbooks:` are injected by trigger.** The owner's message is lower-cased and stripped of punctuation; a
  playbook is injected only when one of its `triggers` appears as a whole phrase. At most 3 per message, 24,000
  characters in total. A missed trigger means the bot never sees the playbook.
- **`skills:` are listed by path.** Every enabled skill appears under *Imported skills* with the path of its
  `SKILL.md`. The bot reads it with its file tools. It is not Claude Code's Skill tool, so write "open the `<name>`
  skill (read its SKILL.md; the exact path is in your Imported skills list)", never "call the skill".
- **Carry a worker's main procedure as both**, and have the `soul` say to open the skill when it is not already in
  the instructions. Then a message that misses every trigger still gets the full procedure.
- **`agents[]` lists are subsets.** When you add a playbook or skill to a worker, also add it to `agents[].playbooks`
  / `agents[].skills` of each agent that should use it. Connections default to none per agent.
- **Apps start off.** A bot installed from a package has app access switched off. A skill that needs an app must say
  what to do when its tools are absent (tell the owner how to turn them on, then stop) and must name exact tools.
  Composio apps are loaded with `COMPOSIO_SEARCH_TOOLS` and run through `COMPOSIO_MULTI_EXECUTE_TOOL`.
- **`attach_file` refuses `.html`.** Deliver Markdown (or another accepted type) and give the HTML's path in chat.
- **Background tasks replace the answer.** A shell command that outlives its timeout is moved to the background,
  and when it finishes it wakes the bot and can overwrite the final reply. Helpers must have a hard deadline, and the
  skill must say to run them in the foreground and wait for anything that went to the background.
- **`release` drives updates.** It is published in `catalog.json`; installed copies are offered an update when it
  is higher. Bump it for every change to the worker or to any playbook or skill it carries.

## Declaring apps and MCP connections

A worker reaches outside tools in one of two ways. Pick one per tool.

| | `apps:` (a Composio app) | `connections:` (your own MCP server) |
|---|---|---|
| Use for | A service Composio already hosts: Exa, GitHub, Gmail, DeepWiki, cve.now, … | An MCP server you run, such as an internal knowledge base |
| Fields | `slug`, `label`, `reason`, `optional` | `key`, `label`, `reason`, `mcp: {transport, url, valueNames}` |
| Who gets it | The whole worker | Only the agents that list its `key` in `agents[].connections` |
| Example | `workers/literature-surveyor/WORKER.md` | `workers/adlc/WORKER.md` (`qaci-data`) |

### Required: verify before you add an app or a connection

Do **not** add an entry to `apps:` or `connections:`, or name a tool in a `SKILL.md`, until all of these pass.
A wrong slug or tool name does not fail `npm test`; it fails later, in a user's chat, as a tool the bot cannot find.

1. **The slug exists.** `GET https://backend.composio.dev/api/v3/toolkits/<slug>` returns the toolkit (not 404),
   and its `name` is the service you mean. For a `connections:` slot, the `https://` URL answers as an MCP server.
2. **Every tool name exists.** In a bot with the app connected, `COMPOSIO_SEARCH_TOOLS` returns each tool the
   `SKILL.md` names (for example `EXA_SEARCH`), spelled exactly, and the parameters the skill uses are in its schema.
3. **One real call works.** The bot calls each named tool once through `COMPOSIO_MULTI_EXECUTE_TOOL` (or the
   connection's tool) and gets a real result, not an error.
4. **The missing-app path works.** With app access off, the bot follows the skill's instruction (tells the owner
   how to turn it on, then stops) instead of answering from memory.

Write the result in the pull request's *Tried on* section: slug, tools checked, and one real call that worked. A
reviewer must not merge a new app or tool name without it.

### The `slug` of an app

- **It is the Composio toolkit slug, exactly**, in lowercase. Checked against Composio's API:

  | App | Slug | Wrong guesses Composio does not know |
  |---|---|---|
  | Exa | `exa` | |
  | DeepWiki | `deepwiki_mcp` | `deepwiki` |
  | cve.now | `cve_now_mcp` | |
  | Semantic Scholar | `semanticscholar` | `semantic_scholar` |
  | GitHub, Gmail, Render | `github`, `gmail`, `render` | |
  | X / Twitter | `twitter` | `x` |

  Toolkits that wrap a hosted MCP server end in `_mcp`; others do not, and a multi-word name may have no separator.
- **Do not guess it; check it.** Either:
  - ask Composio: `GET https://backend.composio.dev/api/v3/toolkits/<slug>` with your own key in the `x-api-key`
    header returns the toolkit (`slug`, `name`) or 404 when the slug is wrong; or
  - run `COMPOSIO_SEARCH_TOOLS` in a bot with the app connected: every tool it returns names its toolkit, and that
    name in lowercase is the slug.
- **Validator rule:** `^[a-z0-9][a-z0-9_-]*$`, at most 64 characters. `label` (≤100) is the name the owner sees,
  for example `DeepWiki`. `reason` (≤240) is one sentence on what the worker does with it. Set `optional: true`
  unless the worker can do nothing at all without the app.
- **What the app does with it:** QACI Duo shows `label` and `reason` at install and keeps the list with the installed
  bot. It does **not** connect or switch on anything. The owner connects the app and turns on app access in the
  bot's **Settings → Apps**, so every skill that uses an app must say what to do when its tools are missing.

### Tool names inside a SKILL.md

- Composio tool names are the toolkit slug in upper case plus the action: `EXA_SEARCH`, `EXA_GET_CONTENTS_ACTION`,
  `DEEPWIKI_MCP_ASK_WIKI_QUESTION`, `CVE_NOW_MCP_GET_VULNERABILITY`, `SEMANTICSCHOLAR_DETAILS_ABOUT_A_PAPER`. Copy them
  exactly from what `COMPOSIO_SEARCH_TOOLS` returns, with the parameters that matter (`category: "research paper"`, …).
  For a regular toolkit, `GET https://backend.composio.dev/api/v3/tools?toolkit_slug=<slug>` also lists them; an
  `_mcp` toolkit's tools come from its MCP server and show up only through `COMPOSIO_SEARCH_TOOLS`.
- Tell the bot to load tools once: tool search for `COMPOSIO_SEARCH_TOOLS` and `COMPOSIO_MULTI_EXECUTE_TOOL`, call
  `COMPOSIO_SEARCH_TOOLS` for the toolkits it needs, then run tools through `COMPOSIO_MULTI_EXECUTE_TOOL` in
  batches. Put the tools in a *Need → Tool* table, as `workers/literature-surveyor/skills/survey-literature/SKILL.md` does.

### A `connections:` slot

- `key` follows the same rule as an app slug. `mcp.url` must be `https://` with no credentials in it.
  `mcp.transport` is `http` or `sse`. `valueNames` lists only the **names** of headers the installer fills in (for
  example `Authorization`), never their values.
- A connection is given to no agent by default: add its `key` to `agents[].connections` of each agent that needs it.

## Writing a good skill

- One procedure with one result. Inputs asked once, all together, with a default when nobody answers.
- Numbered steps, each concrete, with a *Check:* line where a step commonly goes wrong.
- Chain skills explicitly: end a skill with a *Next:* line naming the next skill, and hand off through files in a
  shared working folder (for example `research/<topic-slug>/`) rather than through chat.
- Name every tool and its parameters; say what to do when a tool is missing or fails. Never let the bot fill a gap
  from memory.
- Evidence rules: never invent papers, numbers, people or links; every claim points to a source produced in the run.
- Guardrails: **Never** and **Ask first** lists cover sending, publishing, deleting, spending and costly jobs.
- Keep souls and skills in English; tell the bot to reply in the owner's language.

## Testing a change

`npm test` proves the format, not the behaviour. Before proposing a change to a worker's procedure:

1. `npm run build` and import `dist/packages/<id>.json` into a real QACI Duo (Templates screen), turn on its apps,
   and give it a realistic request — once with a message that matches a trigger and once with one that does not.
2. Compare against the previous release on the same requests. Note what improved, what regressed, and run time and
   cost, in the pull request's *Tried on* section.

## Conventions

- Commit messages and PR titles in English, imperative mood ("Add rebuttal playbook to Paper Writer").
- When you change a rule in `scripts/lib.mjs`, add or update a test in `tests/validate.test.mjs`, and update
  FORMAT.md and `schema/` to match.
- When you add or rename a worker, update the *Available today* table in README.md.
- Do not commit `dist/`, `.next/`, `node_modules/`, credentials, or personal data.
