# Contributing

Thank you for helping QACI Duo's Digital Workers get better at real work.

## What do you want to do?

| Goal | What to change |
|---|---|
| Add a capability | Create `skills/<your-playbook>/SKILL.md` from [`templates/skill/SKILL.md`](templates/skill/SKILL.md). To have a worker carry it, add its name under `playbooks:` and/or `skills:` in `workers/<worker>.md` — and under the same list of each agent in `agents[]` that should use it — then bump that worker's `release`. |
| Improve a playbook | Edit `skills/<name>/SKILL.md` and bump the `release` of every worker that carries it (as a playbook or a skill). |
| Give a worker an app | Add an entry under `apps:` (`slug`, `label`, `reason`, `optional`), and name the app's tools in the `SKILL.md` that uses them. The `slug` is the Composio toolkit slug; see [AGENTS.md](AGENTS.md#declaring-apps-and-mcp-connections) for how to find it and how to name tools. Never add credentials. |
| Propose a new worker | Create `workers/<your-worker>.md` from [`templates/worker.md`](templates/worker.md) and list the playbooks and skills it carries. |

A playbook is **one procedure that produces a result** — "verify a reference list", "design the experiments". A
worker is a **role** that carries several of them — "Literature Surveyor". If you are describing a role, you are
writing a worker. In the research workflow each step is one standalone worker (Surveyor → Designer), and the owner
carries the files from one to the next.

### Playbook or skill?

How the app uses each matters when you write one:

- A **`playbooks:`** entry is injected into the bot's prompt only when the owner's message contains one of its
  `triggers` as a whole phrase (case and punctuation ignored), at most 3 per message and 24,000 characters in total.
  Write triggers as words a user really types: "survey", "related work", "design experiments".
- A **`skills:`** entry is always listed in the bot's prompt under *Imported skills* with the path of its
  `SKILL.md`; the bot opens it when the task calls for it. Refer to another skill in a procedure as "open the
  `<name>` skill (read its SKILL.md; the exact path is in your Imported skills list)".
- A worker's main procedure is best carried as both, and its `soul` should say to open the skill when the playbook
  was not injected — so a message that misses every trigger still gets the full procedure.

## Steps

1. Fork the repository (or, if a code owner in `.github/CODEOWNERS` gave you write access, create a branch).
2. Write your files following [FORMAT.md](FORMAT.md). A playbook's folder and its `name` must match; a worker's file
   name and its `id` must match.
3. Run the checks locally (Node 20 or later):

   ```sh
   npm ci --ignore-scripts
   npm test
   npm run build   # writes the generated library to dist/
   ```

4. Open a pull request against `main` and complete the checklist.

## Try it before you open a pull request

- **One playbook:** paste the whole `SKILL.md` into QACI Duo under **Settings → Skills → Import a skill** (turn on
  **Advanced mode** to see *Skills*), switch it on, **Assign** it to a worker, and give the worker a real task.
- **A whole worker:** run `npm run build`, then import the generated file `dist/packages/<worker>.json` from QACI
  Duo's Templates screen. QACI Duo shows a preview before anything is added. Turn on the apps the worker declares
  in the bot's **Settings → Apps**.
- **Browse locally:** `npm run site:dev` starts a small read-only site that lists every worker and playbook in the
  repository (including yours on your branch).

## Review

| Step | Who | What happens |
|---|---|---|
| Pull request opened | Contributor | CI `validate` checks the format, the repository layout, secrets, hidden-instruction tricks, and the package generated for each worker |
| Review | Code owner (see `.github/CODEOWNERS`) | Reads the content: is the procedure correct, safe, specific, and does it stop before actions that need approval? |
| Merge to `main` | Code owner | Possible only with a green check and an approval |
| Publish | `Publish library` workflow | Regenerates the `library` branch within about a minute |
| Available in QACI Duo | Users | New installs see it as soon as `library` is published; existing installs are offered an update when the worker's `release` is higher |

## What reviewers look for

- **Specific steps.** Each step is concrete enough for someone else to repeat and has a *Check:* line.
- **Inputs first.** The playbook says what to ask before starting, and the default when an input is missing.
- **A defined output.** The *Output* section shows the exact shape of the result.
- **Evidence.** The worker is told to cite sources and to separate verified facts from inference; it never invents
  papers, numbers or people.
- **Named tools.** When a step needs an app, the playbook names the exact tool and what to do when it is missing.
- **Verified apps.** A new app, connection or tool name comes with proof in *Tried on*: the slug exists on Composio,
  every named tool exists, and one real call worked ([AGENTS.md](AGENTS.md#required-verify-before-you-add-an-app-or-a-connection)).
- **Guardrails.** *Never* and *Ask first* lists cover sending, submitting, deleting and running costly jobs.
- **No private data.** No names of colleagues, internal projects, customer or patient data, links with credentials.
- **Tested.** The pull request says what real request the worker was given and what came back.
- **Plain English.** Short sentences, active voice, consistent terms.

## Commit messages

Write commit messages and pull request titles in English, in the imperative mood: "Add rebuttal playbook to Paper
Writer", "Clarify inputs of find-papers".
