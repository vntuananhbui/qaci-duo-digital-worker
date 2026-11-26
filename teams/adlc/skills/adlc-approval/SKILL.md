---
name: adlc-approval
title: Approval at the four ADLC approval points
description: Decide whether to self-approve or ask the owner with an approval card at SPEC, plan, push and merge, based on the Approval points line; use at every approval point.
triggers: adlc approval, approval points, approval card, ask owner to approve, self-approve, duyệt ở 4 điểm của luồng adlc
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Approval at the four ADLC approval points

The process skills (`adlc-feature`, `adlc-bugfix`, `adlc-research`, `adlc-chore`, `adlc-paper-prototype`) say "ask for approval with the SPEC approval / Plan approval / Push approval / Merge approval card" at the exact place an approval is needed. This skill decides **whether a card is actually sent there**: depending on the setting below, it is not always sent. Every other step of the process skill (writing the SPEC, planning, review, running tests yourself, merging, reporting, …) is still done in full as that skill describes.

Git follows `adlc-git-local`: the **base branch** is `main` unless the assignment names another one. A "PR" is a work branch you merge yourself. Publishing to the owner's GitHub or Azure DevOps happens only after the merge, through `deploy-github` / `deploy-azure-devops`.

## When to use

- At each of the four approval points in any ADLC process skill: SPEC, plan, push, merge.
- Whenever you need the owner to decide something (choose an option, pick several items, answer a free-form question).
- Before any destructive or external action (these always need a card).

**Not for:** classifying work (`adlc-triage`), writing the progress log or Completion report (`adlc-report`), publishing or deploying (`deploy-github`, `deploy-azure-devops`, `deploy-render`), the UI preview itself (`adlc-ui-preview`).

## Inputs

| Input | Required | Default |
|---|---|---|
| The `Approval points:` line in the team brief (Shared section context) | No | Missing line = auto |
| The approval point being reached (`spec`, `plan`, `push`, `merge`) | Yes | — |
| Work type and size (from `adlc-triage`) | Yes | — |
| Explicit owner instructions in this conversation (e.g. "show me before merging", "just do it, don't ask" for this task) | No | None |
| Branch name and base branch (for push and merge) | For push/merge | Base branch `main` |

## The four approval points

| Point | Phase | When | What the owner approves |
|---|---|---|---|
| `spec` | Specify | Before planning starts | The SPEC (feature), bug report (bugfix), research brief (research), description of a large chore (chore), paper brief (paper-prototype) |
| `plan` | Plan | After the test plan and implementation plan exist, **before implementation starts**. **Not needed for a Small task** (`adlc-feature`, section "Small task"), except for paper-prototype (see below). | The plan: parts, branches, test cases |
| `push` | Implement | Commits made and tests run, **before the branch is marked ready for review** | Branch, commit list, diff summary, tests run |
| `merge` | Merge | Review passed and tests green, **before merging into the base branch** | The branch about to be merged, review and test results |

The **Bug confirmation** card (step 0 of `adlc-bugfix`, for a bug reported automatically) is **not one of the four points and is always asked**, whatever the setting below: an automatic alert nobody has confirmed as a real bug must never be treated as approved.

## Approval point setting: auto or ask owner

Read the line that starts with `Approval points:` in the **Shared section context** block at the top of your system instructions (the owner or an admin edits it in the app; it takes effect from the next turn, no reinstall needed). Also accept the legacy Vietnamese form `Điểm duyệt:` used by already-installed teams. **No line at all = auto** — this is the team default.

| Line (English) | Legacy form (also accepted) | Meaning |
|---|---|---|
| `Approval points: auto` (or no line) | `Điểm duyệt: tự động` | No card at any of the four points; self-approve and log it |
| `Approval points: ask owner` | `Điểm duyệt: hỏi chủ` | Card at **all four** points; never write "self-approved" |
| `Approval points: ask owner at <list>` | `Điểm duyệt: hỏi chủ khi <list>` | Card only at the listed points; the rest are auto (still logged) |

- `<list>` is comma-separated, each item one of `spec`, `plan`, `push`, `merge`. Example: `Approval points: ask owner at spec, merge` → SPEC approval and Merge approval by card; Plan approval and Push approval self-approved (and logged).
- **Auto**: do not send a card; self-approve and continue immediately, but **always record every self-approval**:
  - in the progress log (`adlc-report`), at the moment of approval: time, point (e.g. "Merge approval"), why it passes, evidence;
  - in the Completion report: a "Self-approved" line or section listing each point as `Self-approved: <point> — <reason> — <evidence>` (reason e.g. "review passed, tests green, 12/12 test cases"; evidence: commands run, test counts, path to the diff or evidence).
- A malformed line or unknown point name: apply the part you can read, ignore the rest, and tell the owner in one sentence in your next reply how you are interpreting the line — do not guess further and do not stop work to ask.

**Always send a card, whatever the `Approval points:` line says:**
- The owner **said explicitly in the conversation** that they want to approve this point or this work (e.g. "show me before you merge", "from now on ask me before pushing"). Never skip a card the owner asked for, even in auto mode or when the point is not in the list.
- **Plan approval for `paper-prototype` work**: that plan fixes the dataset, the deviations from the paper and the match thresholds, so the owner must see it before any code is written, even for small work. Skip it only if the owner explicitly says not to ask for that task.
- **Destructive or external actions**: force-push, deleting a branch, pushing directly to the remote's base branch (bypassing PR/review), spending money, sending email or publishing externally, and every action that leaves the system (creating a repository, first push, pushing a branch to an existing repository, opening a pull request, switching to public, a release, an FCode Market listing, any Render deploy or redeploy, a public link). These are not approval points; they are a separate limit that the `Approval points:` line cannot turn off.

An owner instruction for one task ("just do it, don't ask") is a per-task rule, not a change to the setting; apply it and still log each self-approval.

## Procedure

1. Identify the approval point you reached and the work type. *Check:* it is one of `spec`, `plan`, `push`, `merge` (or a decision/always-card case above).
2. Read the `Approval points:` line (or legacy `Điểm duyệt:` line) and decide: card or self-approve. Apply the always-card overrides. *Check:* Small task skips Plan approval except for paper-prototype.
3. For push and merge, run the branch checks and prepare the diff (section "Push approval and Merge approval need the git diff") — **also when self-approving**.
4. If a card is needed: send the full document (SPEC, plan) in a message just before the card, then send the card with the ask-user tool using the template below. Wait for the answer; do not continue the part that needs approval.
5. If self-approving: record it in the progress log now and keep it for the Completion report, then continue.
6. Handle the answer (section "Handling the answer") and log it.

## General rules for asking

- Approvals and decisions always go to **the owner** through **the ask-user tool** (usually named `ask_user` or `request_user_input`). It shows as a card with buttons in the owner's chat.
- **Never** ask for approval in a plain sentence in a reply, and never ask anyone or anything other than the owner to approve. A subagent never approves on your behalf.
- An approval card is **always** sent with the ask-user tool, **never** with a `NEEDS INPUT:` line, and never with a `Default:`. Only the owner can answer the card; your turn waits until they click.
- End a message with a `NEEDS INPUT:` line only when there is **genuinely** a question for the owner. If there is none, do not write the line (never "NEEDS INPUT: none"): the line always triggers a card.
- After asking, **wait for the answer**. Silence is not consent; do not continue the part that needs approval.

## Approval card template

One question, containing:

- **Short header**: exactly `SPEC approval`, `Plan approval`, `Push approval` or `Merge approval`.
- **Question body**: a summary sufficient to decide without opening anything else, at most about 15 lines: what the work is, scope, key numbers, branch, test results. The full version (SPEC, plan) goes in the message right before the card.
- **Two options**, each with a description of what happens next:
  - `Approve`: e.g. "Start planning now", "Start implementation", "Mark the branch ready for review", "Merge into the base branch".
  - `Request changes`: "Write what to change in the reply box".
- Always leave the free-text reply box open.

## Push approval and Merge approval need the git diff

The owner can only approve what they can see. Right **before** the card:

0. **Check the branch is fully committed**, run in the branch's worktree. If anything fails, fix it first; do not send the card yet:
   - `git status --short` prints nothing: every change is committed, no `M` or `??` files belonging to this work remain.
   - `git log --oneline <base>..<branch>` shows at least one commit. Push approval approves **existing commits**, not changes to be committed later.
   - Every new file (code, **tests**, docs) is in a commit: `git show --stat --format= <base>..<branch>`. A file ignored by `.gitignore` (`git check-ignore -v <file>` prints a match, e.g. the repo ignores `tests/*`) is added with `git add -f <file>`, and you say so in the message.
   - The tests you report in the card ran on exactly that commit (re-run after committing if you changed anything).
1. Write the whole diff to a file in the working directory: `git diff <base>...<branch> > review-<branch>.diff.txt` (replace `/` in the branch name with `-`). For Merge approval the diff is exactly what is about to enter the base branch.
2. Attach the file with `attach_file`, then delete it. Never commit this file.
3. Send one short message: the branch, its commits (`git log --oneline <base>..<branch>`) and `git diff --stat <base>...<branch>`. **Do not** paste the diff into the message.

The card body says "Full diff in the attachment just above". For UI changes, the Push approval card also comes with the preview from `adlc-ui-preview` (screenshots just above, the app running on the desktop so the owner can Take control and try it).

A point that is **self-approved** (no card) still runs step 0 above and records that diff file in the progress log/evidence, so the exact diff that was self-approved can be reviewed later.

## Other card types

Used when the owner must decide, not to approve (these are always asked, regardless of the `Approval points:` setting):

- **Single choice**: each option is one alternative; its description gives short pros and cons. E.g. choosing an implementation approach, choosing a research recommendation.
- **Multiple choice**: enable multi-select. E.g. choosing which bugs to fix in this round.
- **Free-form question**: one question with no options, when information only the owner has is missing.
- **Several questions in one card**: when several points need clarifying at once, at most 3 questions.

## Handling the answer

- `Approve`: continue with exactly what the option described.
- `Request changes` or a free-text answer: apply it, then **ask again with a new card** showing the revised version. Do not continue without an `Approve`.
- Log it in the progress log: the point, time asked, time answered, result (owner asked) — or reason and evidence (self-approved).

## Output

Either a card (ask-user tool) or a self-approval log entry.

Card:
```
Header: <SPEC approval | Plan approval | Push approval | Merge approval>
Question: <work> — <scope> — <key numbers> — branch <branch> — tests <passed>/<total>. Full diff in the attachment just above. (≤ ~15 lines)
Options:
- Approve — <what happens next>
- Request changes — Write what to change in the reply box
```

Self-approval (progress log row and Completion report line):
```
Self-approved: <point> — <reason> — <evidence: commands, test counts, diff/evidence path>
```

## Quality checklist

- [ ] Read the `Approval points:` line (or legacy `Điểm duyệt:`); missing line treated as auto.
- [ ] Always-card overrides applied (owner request, paper-prototype plan, destructive/external actions, Bug confirmation).
- [ ] For push/merge: clean `git status`, commits exist, new files committed, tests ran on that commit, diff attached and deleted.
- [ ] Card header is exactly one of the four titles; body ≤ ~15 lines; two options with descriptions; free-text box open.
- [ ] No `NEEDS INPUT:` used for an approval; no `Default:` on an approval card.
- [ ] Every self-approval logged in the progress log and listed in the Completion report.

## Guardrails

**Never**
- Never treat silence as approval or continue the approved part before `Approve`.
- Never ask for approval in plain text or with a `NEEDS INPUT:` line.
- Never let a subagent or anything other than the owner approve.
- Never skip a card the owner explicitly asked for.
- Never commit the review diff file.

**Ask first** (always a card, even in auto mode)
- Force-push, deleting a branch, pushing directly to the remote's base branch.
- Spending money, sending email, publishing externally, creating a repository, first push, switching to public, a release, an FCode Market listing, any Render deploy or redeploy, a public link.
- Plan approval for paper-prototype work; Bug confirmation for an automatic bug report.

## Example

**Request:** The team brief says `Approval points: ask owner at merge`. A feature branch `feature/export-filter-api` has passed review and tests.

**Response outline:**
1. Plan approval and Push approval were already self-approved and logged: "Self-approved: Push approval — 3 commits, 14/14 tests pass on HEAD — review-feature-export-filter-api.diff.txt".
2. Now at merge: `git status --short` empty, commits listed, diff written, attached with `attach_file`, deleted.
3. Short message with the commit list and `git diff --stat main...feature/export-filter-api`.
4. Card "Merge approval": the feature, 14/14 tests, 6/6 test cases Pass, "Full diff in the attachment just above"; options Approve — "Merge into main", Request changes.
5. Wait; on Approve, merge and log the time asked, time answered and result.
