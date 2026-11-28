# QACI Duo Digital Workers

The library of **Digital Workers** and **playbooks** that QACI Duo installs from, maintained by pull request.

- A **Digital Worker** is one bot in QACI Duo (or a small team of bots), with a role, a standing system prompt
  (`soul`), working rules and a set of capabilities.
- A **playbook** is one capability: a concrete procedure written as a standard `SKILL.md`. The same file can be
  carried by a worker as a trigger-injected *playbook*, as an embedded *skill*, or both — see
  [FORMAT.md](FORMAT.md#playbook-vs-skill-the-same-skillmd-file-two-ways-to-carry-it).

```
workers/<id>/ (worker.yaml, BRIEF.md, souls/, skills/) ─┐
skills/<name>/  (shared skills) ─────────────────────────┴─► PR into dev ─► CI (validate + benchmark) + code-owner review
   ─► dev (`library-dev`, QACI Duo dev) ─► benchmark on dev ─► PR dev → main ─► main (`library`, production)
```

## Available today

| Digital Worker | What it does | Agents | Carries | Apps |
|---|---|---|---|---|
| **Literature Surveyor** (`workers/literature-surveyor/`) | Searches, verifies and close-reads papers; writes a cited `SURVEY.md` with a novelty verdict and a brief for experiment design | `surveyor` | playbook `survey-literature` + 6 skills | Exa; DeepWiki, cve.now optional |
| **Experiment Designer** (`workers/experiment-designer/`) | Turns an idea and a survey into a reviewed plan with pass and fail criteria: `DESIGN.md` + `DESIGN.html` | `designer` | playbook `design-experiments` + 9 skills | Exa; DeepWiki optional |
| **Social Media Marketer** (`workers/social-media-marketer/`) | Plans a month of posts, writes a daily post from fresh news, drafts replies and a weekly report; a human approves anything that goes public | `marketer` | 6 job playbooks + 14 skills | Facebook, Instagram, LinkedIn, Exa, Google Analytics, Google Sheets; Threads, TikTok optional |
| **ADLC** (`workers/adlc/`) | Autonomous software delivery, end to end | `bot` | 16 `adlc-*` / `deploy-*` skills | GitHub, Render; MCP slot `qaci-data` |

The two research workers are standalone: neither hands work to another bot. The owner brings `SURVEY.md` from the
Surveyor to the Designer. The current release of each worker is its `release` field, also
published in the library's `catalog.json` so QACI Duo can offer an in-place update.

## Use them in QACI Duo

- **Install a whole worker:** open the Templates screen (**QACI Digital Worker**), pick the worker and add it. QACI
  Duo shows a preview first; connected apps stay off until you turn them on in the bot's **Settings → Apps**.
- **Install from a file:** use `packages/<id>.json` on the `library` branch. It is the shape the app imports;
  `packages/<id>.md` is this repository's own catalog format.
- **Add one playbook to a worker you already have:** open its `SKILL.md` on the
  [`library` branch](https://github.com/vntuananhbui/qaci-duo-digital-worker/tree/library/skills) (choose
  **Raw**), copy it, and paste it into **Settings → Skills → Import a skill** (Settings shows *Skills* in **Advanced
  mode**). An imported skill arrives switched off: read it, switch it on, then **Assign** it to the worker.
- **Try a worker before it is merged:** see [CONTRIBUTING.md](CONTRIBUTING.md#3-try-it-in-qaci-duo).

## Contribute

Add a skill, improve one, or propose a new worker: start with [CONTRIBUTING.md](CONTRIBUTING.md); the file format
is in [FORMAT.md](FORMAT.md). Coding agents working in this repository should read [AGENTS.md](AGENTS.md). Have an
idea but no time to write it? Open an **Idea** issue.

Two branches hold the sources and two are generated from them by the `Publish library` workflow (never edit those
by hand):

| Source branch | Generated branch | Read by |
|---|---|---|
| `dev`: every pull request targets it | `library-dev` | the dev QACI Duo |
| `main`: a code owner promotes `dev` into it | `library` | production QACI Duo |

A change reaches users only after review, a merge to `dev`, a benchmark on dev, and promotion to `main`.

## Browse

`npm run site:dev` runs a small Next.js site that lists the Digital Workers and playbooks in this repository and
lets you read or copy any of them. CI does not run it: CI runs only `npm test` and `npm run build`.
