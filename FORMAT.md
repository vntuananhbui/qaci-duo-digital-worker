# File format

## Playbook — `skills/<name>/SKILL.md`

A standard [SKILL.md](https://agentskills.io) with a few extra fields. QACI Duo's Skills library reads each
frontmatter field from **one line**, so do not use YAML lists or multi-line values: separate list items with commas,
and put a value that contains `": "` in double quotes.

| Field | Required | Meaning |
|---|---|---|
| `name` | yes | Equal to the folder name; lowercase letters, digits and single hyphens, at most 64 characters |
| `title` | yes | Display name in QACI Duo, at most 100 characters |
| `description` | yes | One sentence: what the worker achieves and hands back. At most 300 characters |
| `triggers` | yes | 1–30 comma-separated phrases a user would say when they need this playbook. QACI Duo injects a `playbooks:` entry only when the message contains a trigger as a whole phrase (case and punctuation ignored), at most 3 per message |
| `tags` | no | Up to 8 lowercase comma-separated words |
| `license` | yes | For example `MIT` |
| `author` | yes | Person or team that wrote it |
| `compatibility` | no | Environment notes |

The body is the procedure, at most 24,000 characters, with these sections:

| Section | Purpose |
|---|---|
| `# <Title>` and a short intro | The outcome and who it is for |
| `## When to use` | Situations that call for it, and a **Not for:** line pointing to other playbooks |
| `## Inputs` | A table of what to ask before starting, required or not, and defaults |
| `## Procedure` | Numbered steps, each concrete, with a *Check:* line where it matters |
| `## Output` | The exact shape of the result, usually as a Markdown template |
| `## Quality checklist` | Checkboxes the worker runs before handing back |
| `## Guardrails` | **Never** and **Ask first** lists |
| `## Example` | One realistic request and an outline of the response |

CI refuses unknown fields, long base64-like strings, `curl … | sh`, invisible Unicode characters, and anything that
looks like a secret.

## Digital Worker — `workers/<id>.md`

YAML frontmatter followed by a Markdown body.

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Equal to the file name |
| `release` | yes | Semantic version such as `1.0.0`; bump it whenever the worker or one of its playbooks or skills changes. Published in `catalog.json`; QACI Duo offers an installed copy the update when this is higher |
| `name`, `title` | yes | Worker name and role |
| `tagline` | yes | One sentence, at most 160 characters; shown on the Templates card |
| `description` | yes | What the worker does and never does, at most 2,000 characters; becomes the bot's description |
| `category`, `license`, `author.name` | yes | |
| `color` | yes | `green`, `blue`, `red`, `orange`, `purple`, `cyan`, `pink`, `yellow`, `teal` or `coral` |
| `outcomes` | yes | 1–12 results the user gets |
| `playbooks` | one of `playbooks`/`skills` | 1–30 folder names from `skills/`, carried as lightweight trigger+instructions |
| `skills` | one of `playbooks`/`skills` | 1–30 folder names from `skills/`, each embedded whole as a real, importable skill — see below |
| `apps` | no | Composio apps the worker can use: `slug` (the exact Composio toolkit slug, lowercase, such as `exa` or `deepwiki_mcp` — see [AGENTS.md](AGENTS.md#declaring-apps-and-mcp-connections) for how to check it), `label`, `reason`, `optional`. Declared only, never with credentials. **Add an app only after its slug, every tool name the playbook uses, and one real call have been verified** ([AGENTS.md](AGENTS.md#required-verify-before-you-add-an-app-or-a-connection)) |
| `tags`, `featured`, `setupMinutes` | no | `featured: true` lists the worker first |
| `soul` | no | This worker's own standing system prompt, under 24,000 bytes. Optional; without it the worker runs on `description` alone, as before |
| `connections` | no | Up to 20 declared MCP slots, available to be handed to a specific agent (see below): `key`, `label`, `reason`, `mcp: {transport: http\|sse, url, valueNames}`. A slot never carries a secret value — only the address and the names of the header values an installer supplies |
| `teamBrief` | no | Shared instructions for the whole team, under 24,000 bytes (becomes the generated package's `team.brief`) |
| `examples` | no | Up to 12 suggested questions, shown on the worker's page: `title` (≤120 chars), `input` (a realistic request, ≤4,000 chars), `output` (an outline of the response, ≤8,000 chars) |

A worker needs at least one `playbooks` or `skills` entry (or both); a playbook folder may be used as either, or both,
across different workers. The body needs three sections: `## Mission`, `## Working rules` (including which
playbook/skill to use when) and `## Completion rule`.

### Playbook vs. skill: the same `skills/<name>/SKILL.md` file, two ways to carry it

A `playbooks:` entry becomes a lightweight trigger + instructions pair in the generated package
(`package.playbooks[]`) — enough for most capabilities. A `skills:` entry embeds the **whole SKILL.md file**
verbatim into the generated package (`package.skills.entries[]`), matching QACI Duo's own Skills library format
exactly; use this when the capability needs to also stand on its own as an importable skill, or when porting a
real skill file rather than writing a new lightweight playbook. A worker may use only `playbooks`, only `skills`,
or both (QACI Duo's real `qaciduo-adlc` package, for example, uses only `skills`, no `playbooks` at all).

### Optional: more than one agent, a shared room, paused routines

A worker is always its own agent (`id`/`name`/`title`/`description`/`color`/`soul` above). These fields let it
carry a whole small team instead of a single bot. **All of them are optional and purely additive** — a worker file
with none of them behaves exactly as it did before this extension.

| Field | Required | Meaning |
|---|---|---|
| `agents` | no | Up to 49 extra teammates (50 agents total): `key`, `name`, `title`, `description`, `color`, an optional `soul` (standing system prompt, under 24,000 bytes), an optional `playbooks` subset of this worker's own `playbooks` (defaults to all of them), an optional `skills` subset of this worker's own `skills` (defaults to all of them), and an optional `connections` subset of this worker's own `connections` (defaults to **none** — unlike playbooks/skills, a connection is never handed to an agent unless that agent explicitly lists it) |
| `chiefOfStaff` | no | The lead agent's key — this worker's own `id`, or one of `agents[].key`. Defaults to this worker's `id`; becomes the generated package's `team.leader` |
| `rooms` | no | Up to 30 shared chat rooms between agents: `key`, `name`, `bulletin`, `members` (agent keys), `defaultResponder` (`{kind: agent, agent: <key>}`, `{kind: everyone}` or `{kind: mentions}`) |
| `routines` | no | Up to 50 scheduled automations: `key`, `name`, `agent`, `prompt`, `runOn` (`duo`: where the bot already runs — on a research Team Cloud, the team server; written as the app's `maus` in `packages/<id>.json`. `cloud`: a separate cloud computer, only where the server has cloud computers configured. Use `duo` unless you know cloud computers exist), `durationMinutes` (5-240), `schedule` (`{type: daily, time: "HH:MM", weekdays: [0-6]}`, `{type: cron, expression: "0 8 * * 1-5", timeZone: Asia/Ho_Chi_Minh}` — five fields, minute hour day-of-month month weekday, no seconds or `@` macros, and a named IANA time zone — or `{type: once, at: <epoch ms>}`), and `enabledAfterInstall: false` — **always `false`**: a routine installs paused and its owner turns it on |

See [`templates/worker.md`](templates/worker.md) for a commented example and
[`schema/worker.schema.json`](schema/worker.schema.json) for the declarative shape.

## Declarative schema

[`schema/worker.schema.json`](schema/worker.schema.json), [`schema/playbook.schema.json`](schema/playbook.schema.json)
and [`schema/package.schema.json`](schema/package.schema.json) describe the shapes above as JSON Schema, for editors
and other tooling. They document the hand-written validators in `scripts/lib.mjs`; that file remains the source of
truth and the only gate CI actually enforces, so treat a difference between the two as a bug in the schema.

## The `library` branch (generated)

After each merge the workflow builds, for every worker, a QACI Duo package v2 file (`packages/<id>.md`, YAML
frontmatter `format: qaci-duo.package` / `version: 2`) whose agents are the worker's own agent plus any `agents` it
declares, carrying the worker's playbooks and skills, with any `connections`, `rooms` and `routines` it declares,
under a `team: {name, leader, brief}` object. It also writes the `catalog.json` (`format: qaci-duo.catalog`) that
QACI Duo reads (each entry names its `package`, `packages/<id>.json`, and its `release`), each worker's team manifest (`teams/<id>/team.mausteam.json`, `format: qaci-duo.team`), and a copy
of every `skills/<name>/SKILL.md` (playbook or skill) for individual import.

It also writes `packages/<id>.json` — the **same content**, wrapped as the real QACI Duo app actually reads it
today: `{format: "openmaus.package", version: 2, package: {...}}`. This is the file to use for the app's
Templates-style JSON import (and is what `docs/playbooks/*.json` in `qaci-duo` itself are); confirmed by
importing one into a real, unmodified QACI Duo server. `packages/<id>.md`, by contrast, is this repository's own
catalog/team-library shape — the real app's Markdown import path does not currently read it.
