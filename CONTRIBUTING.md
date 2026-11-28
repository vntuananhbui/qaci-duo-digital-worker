# Contributing

Thank you for helping QACI Duo's Digital Workers get better at real work. This guide takes a change from an idea to
production: what to write, how to prove it works (a benchmark), how it is reviewed, and how it moves from the dev
environment to production.

## Where a change goes

```
your branch ──PR──► dev ──Publish library──► library-dev ──► QACI Duo dev   (qaci-duo-dev.fpt-qaci.com)
                     │
                     └──PR (code owner)──► main ──Publish library──► library ──► QACI Duo production
```

- **Always open your pull request against `dev`.** Never against `main`.
- A merge to `dev` reaches the **dev** QACI Duo within about a minute. A merge to `main` reaches **every production
  user** within about a minute, so a code owner promotes `dev` to `main` only after the change has been benchmarked
  on dev.
- Never edit `library` or `library-dev` by hand; the `Publish library` workflow rebuilds them.

## What do you want to do?

| Goal | What to change |
|---|---|
| Add a capability | Create the folder `workers/<worker>/skills/<name>/` with `SKILL.md` from [`templates/skill/SKILL.md`](templates/skill/SKILL.md) and `benchmark.yml` from [`templates/skill/benchmark.yml`](templates/skill/benchmark.yml). Add its name under `playbooks:` and/or `skills:` in `workers/<worker>/WORKER.md`, and under the same list of each agent in `agents[]` that should use it, then bump that worker's `release`. A capability no worker carries yet goes in `skills/<name>/`. |
| Improve a skill | Edit its `SKILL.md` (in `workers/<worker>/skills/<name>/`, or `skills/<name>/` when shared), update its `benchmark.yml` if the expected behaviour changed (create one if it has none), and bump the `release` of every worker that carries it (as a playbook or a skill). |
| Reuse another worker's skill | Move its folder from `workers/<owner>/skills/<name>/` to `skills/<name>/` (`git mv`), then add the name to the second worker. CI refuses a worker that carries another worker's own skill. |
| Give a worker an app | Add an entry under `apps:` (`slug`, `label`, `reason`, `optional`), and name the app's tools in the `SKILL.md` that uses them. The `slug` is the Composio toolkit slug; see [AGENTS.md](AGENTS.md#declaring-apps-and-mcp-connections) for how to find it, how to name tools, and the checks you must run first. Never add credentials. |
| Propose a new worker | Create `workers/<id>/WORKER.md` from [`templates/worker.md`](templates/worker.md), list the skills it carries, and add it to the *Available today* table in README.md. |

A skill is **one procedure that produces a result**: "verify a reference list", "design the experiments". A worker
is a **role** that carries several of them: "Literature Surveyor". If you are describing a role, you are writing a
worker. In the research workflow each step is one standalone worker (Surveyor → Designer), and the owner carries the
files from one to the next.

### Carried as a playbook, a skill, or both?

Every capability is one `SKILL.md`: in the folder of the worker that carries it (`workers/<id>/skills/<name>/`), or
in `skills/<name>/` when several workers share it (see [FORMAT.md](FORMAT.md#repository-layout)). A worker carries it
in one of two ways, and how the app uses
each matters when you write it:

- A **`playbooks:`** entry is injected into the bot's prompt only when the owner's message contains one of its
  `triggers` as a whole phrase (case and punctuation ignored), at most 3 per message and 24,000 characters in total.
  Write triggers as words a user really types: "survey", "related work", "design experiments".
- A **`skills:`** entry is always listed in the bot's prompt under *Imported skills* with the path of its
  `SKILL.md`; the bot opens it when the task calls for it. Refer to another skill in a procedure as "open the
  `<name>` skill (read its SKILL.md; the exact path is in your Imported skills list)".
- A worker's main procedure is best carried as both, and its `soul` should say to open the skill when the playbook
  was not injected, so a message that misses every trigger still gets the full procedure.

## Step by step

### 1. Write the files

1. Create a branch from `dev` (or fork the repository if you have no write access).
2. Write your files following [FORMAT.md](FORMAT.md) and [AGENTS.md](AGENTS.md#writing-a-good-skill). A skill's
   folder and its `name` must match; a worker's file name and its `id` must match.
3. Before you go further, read [REVIEW_CHECKLIST.md](REVIEW_CHECKLIST.md): it is exactly what your pull request
   will be judged against, item by item.

### 2. Check the format

Node 20 or later:

```sh
npm ci --ignore-scripts
npm test          # format, layout, secrets, hidden-instruction tricks, every benchmark.yml, unit tests
npm run build     # writes the generated library to dist/
```

### 3. Try it in QACI Duo

- **One skill:** paste the whole `SKILL.md` into QACI Duo under **Settings → Skills → Import a skill** (turn on
  **Advanced mode** to see *Skills*), switch it on, **Assign** it to a worker, and give the worker a real task.
- **A whole worker:** after `npm run build`, import `dist/packages/<worker>.json` from QACI Duo's Templates screen.
  QACI Duo shows a preview before anything is added. Turn on the apps the worker declares in the bot's
  **Settings → Apps**.
- **Browse locally:** `npm run site:dev` starts a small read-only site that lists every worker and skill in the
  repository, including yours on your branch.

### 4. Benchmark every skill you changed

Required for every skill whose `SKILL.md` or `benchmark.yml` the pull request changes. See
[Benchmark a skill](#benchmark-a-skill) below. For a pull request into `dev`, a run on your own QACI Duo
(`runs/local.json` in the skill's folder) is enough.

### 5. Open a pull request against `dev`

Fill in every section of the template: *Change*, *Checklist*, *Safety*, *Tried on*. Then CI runs:

| Check | Blocks the merge when |
|---|---|
| `Validate playbooks` | `npm test` or `npm run build` fails |
| `Benchmark skills` | a changed skill has no valid benchmark, the run does not match the current files, or the judged score is below threshold or a critical criterion failed. The report is posted on the pull request. |

### 6. Review

A code owner (`.github/CODEOWNERS`) reviews the pull request against [REVIEW_CHECKLIST.md](REVIEW_CHECKLIST.md):

- **REJECT** when any BLOCKER item fails.
- **CHANGES REQUESTED** when any MAJOR item fails, or a BLOCKER cannot be confirmed.
- **Approve** only when every BLOCKER passes and no MAJOR fails, with both CI checks green.

The reviewer also reads the benchmark report: are the cases realistic, do the criteria test what matters, and do the
answers really come from the skill?

### 7. Merge to dev and benchmark on dev

After the merge, `Publish library` rebuilds `library-dev` and the change is live on the dev QACI Duo.

1. Install or update the worker on dev from the Templates screen.
2. Run the benchmark there: `node scripts/benchmark.mjs init <skill> --env dev`, send every case on dev, paste
   each answer and the conversation link (`threadUrl`).
3. Open a pull request into `dev` that adds `runs/dev.json` in the skill's folder. CI checks that the run used exactly the
   `SKILL.md` that `library-dev` publishes, and judges it.

### 8. Promotion to production

A code owner opens a pull request from `dev` into `main`. `Benchmark skills` then requires, for every skill that
differs between `dev` and `main`, a passing **dev** run of the exact `SKILL.md` being promoted. After the merge,
`Publish library` rebuilds `library` and production users see the change; existing installs are offered an update
when the worker's `release` is higher.

## Benchmark a skill

A benchmark is a small set of real requests with checks a stranger could verify by reading the answer. It proves the
skill does what it says, keeps doing it after a change, and stays safe.

### Write the cases: `benchmark.yml` next to the skill's `SKILL.md`

Start from [`templates/skill/benchmark.yml`](templates/skill/benchmark.yml).

| Field | Rule |
|---|---|
| `threshold` | 0.6–1: the share of criteria, averaged over the cases, that must pass. 0.8 is a good default. |
| `cases` | 3–10 real requests, each with a unique `id` |
| `cases[].input` | The exact message sent to the worker, written as an owner would write it |
| `cases[].matchesTrigger` | `false` on at least one case: a request that misses every trigger, so the skill must still be followed when the playbook was not injected |
| `cases[].criteria` | 1–10 checks, each `check:` saying what a correct answer does |
| `criteria[].critical` | `true` on at least one check per case: what must never go wrong. One critical failure fails the whole benchmark, whatever the average. |

Good cases cover the typical request, a request that misses the triggers, a request with a missing input (does the
skill use its default and say so?), and a request that would tempt the worker into an action that needs approval.

Good criteria are observable in the answer text:

| Weak | Strong |
|---|---|
| "Gives a good survey" | "Names at least 3 papers, each with a DOI or arXiv link produced in this run" |
| "Is safe" | "Asks the owner before sending the email instead of sending it" (`critical: true`) |
| "Follows the format" | "Has the sections Summary, Evidence, Open questions, in that order" |

### Run the cases

```sh
node scripts/benchmark.mjs init <skill> --env local     # or --env dev on the dev environment
```

This writes `runs/<env>.json` in the skill's folder, already bound (by SHA-256) to the current `SKILL.md` and
`benchmark.yml`. Then, for each case:

1. Start a **new** conversation with the worker in QACI Duo and send the case's `input` exactly as written.
2. Let it finish, including any files it produces, and paste the **full** answer into `output`. Do not edit or trim it.
3. On dev, also paste the conversation link into `threadUrl`, so a reviewer can open it.

Set `qaciDuo.url` and `qaciDuo.model` to the QACI Duo and model you used, then check the file:

```sh
node scripts/benchmark.mjs check --base origin/dev --env any
```

Changing `SKILL.md` or `benchmark.yml` after a run makes the run stale. `check` says so, and you run the cases again.

### How it is scored

`Benchmark skills` re-judges the committed answers in CI, so a score cannot be typed in by hand:

- An LLM judge (`claude-opus-5-5` by default) scores every criterion PASS or FAIL from the answer alone, twice,
  independently. The request and the answer are treated as data, never as instructions.
- A criterion passes only when **both** runs say PASS **and** each quotes a passage that really is in the answer.
  A missing verdict, a disagreement, or a quote that is not in the answer counts as a failure (UNSURE).
- A case's score is its share of passing criteria. The skill passes when the mean case score reaches `threshold`
  **and** no critical criterion failed in any case.

To judge locally before you push (this calls the API and costs money):

```sh
ANTHROPIC_API_KEY=... node scripts/benchmark.mjs judge --base origin/dev --env any
```

## Commit messages

Write commit messages and pull request titles in English, in the imperative mood: "Add rebuttal skill to Paper
Writer", "Clarify inputs of find-papers".
