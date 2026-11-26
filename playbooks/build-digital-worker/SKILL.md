---
name: build-digital-worker
title: Build or edit a Digital Worker
description: Turn an owner's idea for a new Digital Worker, or a change to an existing one, into files that pass the library's checks, try them, and open a pull request to main for review. Never pushes to main.
triggers: create a digital worker, new digital worker, build a digital worker, edit a digital worker, update a digital worker, change my digital worker, create a dw, new dw, edit dw, make my own worker, add a skill to a worker, publish a worker
tags: digital-worker, authoring, github, pull-request
license: Unspecified
author: QACI Duo
---

# Build or edit a Digital Worker

Takes the owner from "I want a bot that does X" (or "change how worker Y does Z") to a reviewed pull request
against `main` of the Digital Worker library, `vntuananhbui/qaci-duo-digital-worker`. The files follow the
library's own rules, pass `npm test`, and have been tried before anyone reviews them. Users get the change only
after a code owner merges the pull request; this skill never writes to `main`.

## When to use

- Create a new Digital Worker, or add, change or remove a skill of an existing one.
- Change an existing worker's soul, apps, triggers, examples or release.
- **Not for:** using a worker that already exists (install it from Templates), importing one skill into a bot
  (Settings → Skills → Import a skill), or merging and publishing (a code owner merges; a workflow publishes).

## Inputs

Ask once, all questions together. When an answer is missing, use the default and say so in the plan.

| Input | Required | Default |
|---|---|---|
| New worker, or which existing worker (`id`) to change | yes | — |
| The role in one sentence, and who uses it | yes (new) | — |
| The 1–5 jobs it does, each as "given …, it hands back …" | yes (new) | — |
| What each job needs from the owner (files, links, answers) | no | asked from the owner at run time |
| Apps or MCP servers it must use | no | none |
| Anything it should do on a schedule (what, when, which job) | no | no routines |
| What it must never do, and what needs the owner's approval | no | the library's standard guardrails |
| 2–3 realistic requests a user would send | no | written from the jobs, marked as examples |
| For a change: what is wrong today, with an example conversation | yes (edit) | — |

## Before you start: tools and access

- **A shell with `git` and Node 20 or later** to read the library and run its checks. The repository is public, so
  reading it needs no credentials.
- **The GitHub app** (Composio toolkit `github`), connected to the owner's own GitHub account, to open the pull
  request. No app tools at all in your turn: tell the owner in one sentence to turn on app access (Settings of this
  bot → Apps) and connect GitHub, then stop. Never ask for a token in chat.
- Load the tools once: tool search for `COMPOSIO_SEARCH_TOOLS` and `COMPOSIO_MULTI_EXECUTE_TOOL`, call
  `COMPOSIO_SEARCH_TOOLS` for the `github` toolkit, then run tools through `COMPOSIO_MULTI_EXECUTE_TOOL`.

| Need | Tool (required parameters) |
|---|---|
| Who the owner is on GitHub | `GITHUB_GET_THE_AUTHENTICATED_USER` |
| Can they write to the library | `GITHUB_CHECK_IF_A_USER_IS_A_REPOSITORY_COLLABORATOR` (`owner`, `repo`, `username`) |
| A copy they can write to | `GITHUB_CREATE_A_FORK` (`owner`, `repo`) |
| The commit `main` points at | `GITHUB_GET_A_REFERENCE` (`owner`, `repo`, `ref: "heads/main"`) |
| A new branch | `GITHUB_CREATE_A_REFERENCE` (`owner`, `repo`, `ref: "refs/heads/<branch>"`, `sha`) |
| An existing file's `sha` on the branch | `GITHUB_GET_REPOSITORY_CONTENT` (`owner`, `repo`, `path`, `ref: <branch>`) |
| Add or change a file | `GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS` (`owner`, `repo`, `path`, `message`, `content` in Base64, `branch`, plus `sha` when the file exists) |
| Remove a file | `GITHUB_DELETE_A_FILE` (`owner`, `repo`, `path`, `message`, `sha`, `branch`) |
| The pull request | `GITHUB_CREATE_A_PULL_REQUEST` (`owner`, `repo`, `base: "main"`, `head`, `title`, `body`, plus `head_repo` from a fork) |
| An open pull request already exists? | `GITHUB_LIST_PULL_REQUESTS` (`owner`, `repo`, `head`, `state: "open"`) |

**`GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS` and `GITHUB_DELETE_A_FILE` write to `main` when `branch` is left out.**
Every call must pass `branch` set to the branch you created, and that branch is never `main`.

If a tool is missing or fails, say so and stop at that step; never work around it by writing to `main`.

## Procedure

1. **Get the library and its rules.**
   `git clone --depth 1 https://github.com/vntuananhbui/qaci-duo-digital-worker.git dw-library && cd dw-library`.
   Read `AGENTS.md`, `FORMAT.md`, `CONTRIBUTING.md`, `templates/worker.md` and `templates/playbook/SKILL.md` in full:
   they are the current rules and override anything in this skill that disagrees.
   For a change, also read `workers/<id>.md` and every `playbooks/<name>/SKILL.md` it carries.
   *Check:* `ls workers playbooks` — note every existing skill you could reuse instead of writing a new one.
2. **Ask the inputs** (table above), once.
3. **Plan, then stop and ask.** Show the owner a short plan before writing anything:
   - the worker `id` (lowercase, hyphens), name, title and agent key;
   - each job as one skill: `name`, what it hands back, and whether it is new or reused;
   - which skill is the main procedure (carried under both `playbooks:` and `skills:`) and its triggers;
   - the apps (`slug` each) and why;
   - any routines: what runs, when, and which skill it triggers;
   - for a change: every file that changes, and the new `release`.
   Wait for the owner's OK. A skill shared by other workers changes them too: name them and bump their `release`.
4. **Write the files**, starting from the templates, following `FORMAT.md` and `AGENTS.md` exactly:
   - `workers/<id>.md`: frontmatter (`id` = file name, `release`, `tagline` ≤160, `description` ≤2,000, `apps`,
     `playbooks`, `skills`, `agents[]` with a `soul` that says to open the main skill when it was not injected, and
     the same `playbooks`/`skills` lists), then `## Mission`, `## Working rules`, `## Completion rule`.
   - `playbooks/<name>/SKILL.md`: one-line frontmatter fields (`name` = folder, `title`, `description` ≤300,
     `triggers`, `tags` ≤8, `license`, `author`), then the sections *When to use* (with **Not for:**), *Inputs*,
     *Procedure* (numbered, with *Check:* lines), *Output*, *Quality checklist*, *Guardrails*, *Example*.
   - Refer to another skill as "open the `<name>` skill (read its SKILL.md; the exact path is in your Imported
     skills list)". Name every app tool exactly, and say what to do when it is missing.
   - Routines, when the owner wants scheduled runs, go in the worker's `routines:` (see FORMAT.md): `runOn: duo`
     (where the bot already runs; on a research Team Cloud that is the team server) unless the owner confirms cloud
     computers are configured, `enabledAfterInstall: false` always, a `prompt` that contains one of the main
     playbook's triggers so the procedure is injected, and a `schedule` of `daily` (`time` "HH:MM", `weekdays` 0–6,
     0 = Sunday), `cron` (five fields `minute hour day-of-month month weekday`, no seconds or `@` macros, plus a
     named `timeZone` such as `Asia/Ho_Chi_Minh` — ask the owner's time zone; for example
     `{type: cron, expression: "0 8 * * 1-5", timeZone: Asia/Ho_Chi_Minh}` is 08:00 on weekdays) or `once`. A routine that would publish, send, delete or spend must still stop for the owner's
     approval on every run: say so in its prompt.
   - For a change: edit only what the plan named, and bump `release` (patch for wording, minor for behaviour,
     major for a different procedure or output).
   *Check:* no secrets, tokens, personal data, internal hostnames you were not given, or helper files next to a
   `SKILL.md` (helpers go inline as code blocks).
5. **Verify every app before it goes in.** For each `apps:` slug and each tool a skill names, follow AGENTS.md
   *Required: verify before you add an app or a connection*: the slug exists on Composio, `COMPOSIO_SEARCH_TOOLS`
   returns each named tool with the parameters used, one real call works, and the missing-app path works.
   An app you cannot verify (not connected, tool not found) stays out of the files; list it under "To verify".
6. **Run the checks.** `npm ci --ignore-scripts && npm test && npm run build`. Fix every reported problem and run
   again until it ends with `OK:` and every test passes.
   *Check:* `dist/packages/<id>.json` exists.
7. **Try it.** Attach `dist/packages/<id>.json` with `attach_file` and ask the owner to import it (Templates →
   import a file), turn on its apps, and send two requests: one that contains a trigger phrase and one that does
   not. Ask what came back. If the owner cannot try it now, say the pull request is untested and continue only if
   they agree.
8. **Show the change, then stop and ask.** Show `git status --short`, `git diff --stat`, the pull request title and
   the filled description (Output below). Open the pull request only after the owner says yes.
9. **Open the pull request** (upstream `owner: "vntuananhbui"`, `repo: "qaci-duo-digital-worker"`):
   1. `GITHUB_GET_THE_AUTHENTICATED_USER` → the owner's `login`.
   2. `GITHUB_CHECK_IF_A_USER_IS_A_REPOSITORY_COLLABORATOR` with that `login`. A collaborator writes to the upstream
      repository; anyone else calls `GITHUB_CREATE_A_FORK` and writes to `<login>/qaci-duo-digital-worker`.
      Call the repository you write to the *target*.
   3. `GITHUB_GET_A_REFERENCE` on the target with `ref: "heads/main"` → `sha`. Branch name:
      `dw/<id>-<short-change>` (for example `dw/grant-writer-new`). Check `GITHUB_LIST_PULL_REQUESTS` for an open
      pull request from that branch first; if one exists, update that branch instead of creating another.
   4. `GITHUB_CREATE_A_REFERENCE` on the target: `ref: "refs/heads/<branch>"`, that `sha`.
   5. For each added or changed file: `content` = `base64 < <file> | tr -d '\n'`; for a file that already exists,
      get its `sha` with `GITHUB_GET_REPOSITORY_CONTENT` (`ref: <branch>`); then
      `GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS` with `branch: <branch>` and a message in English, imperative mood.
      For each removed file: `GITHUB_DELETE_A_FILE` with `branch: <branch>`.
   6. `GITHUB_CREATE_A_PULL_REQUEST` on the upstream repository: `base: "main"`, `head: "<branch>"` (or
      `"<login>:<branch>"` with `head_repo: "<login>/qaci-duo-digital-worker"` from a fork), the title and body.
   *Check:* the response shows `base` = `main`, `head` = your branch, and the files you planned and no others.
10. **Deliver.** Reply with the pull request link, what a reviewer will check (CONTRIBUTING.md *What reviewers look
    for*), and anything left: untested parts, apps under "To verify". Say plainly that users get the change only
    after a code owner merges it.

## Output

Pull request title: English, imperative mood ("Add Grant Writer worker", "Teach Literature Surveyor to check
retractions"). Body, following the library's `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Change
<Which worker and skills, and what a user can now get done.>

## Checklist
- [x] Only `playbooks/<name>/SKILL.md` and/or `workers/<worker>.md` changed (plus README if a table changed)
- [x] `name` matches the folder; `id` matches the file name
- [x] The `release` of every affected worker is bumped
- [x] The playbook has every section in FORMAT.md, with *Check:* lines and an *Output* template
- [x] `npm test` passes
- [ ] Tried in QACI Duo            ← tick only if step 7 happened
- [ ] New or changed app / connection / tool name verified   ← tick only if step 5 passed for each

## Safety
- [x] No tokens, passwords, personal data, internal names, binaries or scripts
- [x] *Guardrails* covers actions that need approval
- [x] The worker is told to cite sources and never invent papers, numbers or people

## Tried on
<The two requests from step 7 and what came back. For each app: slug, tools checked, one real call that worked.>
```

## Quality checklist

- [ ] The owner approved the plan (step 3) and the change (step 8) before the pull request was opened.
- [ ] `npm test` ends with `OK:` and no failing test.
- [ ] Every write call passed `branch` set to the new branch; nothing was written to `main`.
- [ ] The pull request's base is `main`, its head is the new branch, and it lists only the planned files.
- [ ] Every app slug and tool name in the files was verified; unverified ones are listed, not added.
- [ ] Every affected worker's `release` is bumped, including workers that share a changed skill.

## Guardrails

**Never**
- Push, commit or write a file to `main`, call `GITHUB_UPDATE_A_REFERENCE` on `main`, or force-push anything.
- Merge, approve or close a pull request, or edit the `library` branch: a code owner merges and a workflow publishes.
- Call a file-writing tool without `branch`, or with `branch: "main"`.
- Ask for a GitHub token or password in chat, or put any credential, key or personal data in a file.
- Add an app, connection or tool name that was not verified in step 5.
- Change a worker or skill the owner did not ask to change.

**Ask first**
- The plan (step 3), and opening the pull request (step 8).
- Removing a worker or a skill, or changing a skill that other workers also carry.
- Opening the pull request without having tried the worker (step 7).

## Example

**Request:** "Create a Digital Worker that reads a grant call and my CV and drafts a one-page eligibility check and
a list of documents to prepare. It should search the funder's website with Exa."

**Response outline:** Asks the inputs once. Plan: worker `grant-writer` (agent `writer`), skills `read-grant-call`
(new, main procedure, triggers "grant call, am I eligible, grant application") and reused `find-papers` for prior
work; app `exa`. After the owner's OK, writes `workers/grant-writer.md` and `playbooks/read-grant-call/SKILL.md`,
verifies `exa` and `EXA_SEARCH` with one real call, runs `npm test` until `OK:`, attaches
`dist/packages/grant-writer.json` for the owner to try, shows the diff, then — on "yes" — forks (the owner is not a
collaborator), creates `dw/grant-writer-new`, writes both files to that branch, and opens a pull request to `main`.
Replies with the link and notes that users get the worker only after a code owner merges it.
