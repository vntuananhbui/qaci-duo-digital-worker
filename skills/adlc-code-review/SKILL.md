---
name: adlc-code-review
title: Self-review before merge
description: "The agent's own review of a branch before Merge approval: run the tests and the app yourself, exercise every test case under real conditions, and pass a fixed checklist with evidence."
triggers: "adlc code review, code review, review code, self-review, review before merge"
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Self-review before merge

Before every merge you review your own branch as a strict reviewer would, not on the confidence of the turn that wrote the code. A real review, never a rubber stamp. Viewing diffs, running a branch and merging follow `adlc-git-local`.

## When to use

- In the Verify phase of `adlc-feature`, `adlc-bugfix` and `adlc-chore`, for every branch, before the **Merge approval** point.
- When a subagent produced the code: review its branch the same way; its own report is not evidence.

**Not for:** UI acceptance after merge (`adlc-verify-browser`), UI preview before push (`adlc-ui-preview`), the final report (`adlc-report`).

## Inputs

| Input | Required | Default |
|---|---|---|
| Branch and base branch | Yes | From the plan |
| SPEC (or bug report) and the boundaries fixed in the plan | Yes | `sharedBotFolder/plans/<repo>-<task>/` |
| Test plan (TC list) | Yes | From the plan |
| Production run configuration (Dockerfile, `gunicorn.conf.py`, worker count, celery) | No | Read from the repository |

## Procedure

1. Read the whole branch diff against the SPEC (or bug report) and the **boundaries fixed** in the plan.
2. **Run the branch's tests yourself** in a temporary worktree. Do not trust numbers from an earlier turn or a subagent.
   - For tasks with an API, a command or a UI: **start the app yourself** (per the soul's "Running tests": test database, an admin account and a regular user) and exercise **each test case** as a real user would, recording commands and results in the review notes.
   - **No Merge approval until you have run the tests and exercised the cases yourself.** If something cannot be run (missing service, missing access), mark it "not verified" with the reason in the approval card or self-approval line; never write Pass for it.
3. Go through every checklist section below.
4. Any item missing: write concrete findings (file, line, what to change, why) in the progress log, fix them on the same branch, then **review again from step 1**. Count the rounds.
5. All items pass: proceed to the **Merge approval** point (`adlc-approval`), then merge. Record in the progress log (`adlc-report`): review time, result, number of rounds.

## Checklist: general

- Meets the requirement and the fixed boundaries; nothing changed outside scope.
- All new or behavior-changing code has tests; existing tests were not deleted or loosened to pass.
- Tests are **in the branch's commits**, not only in the worktree: `git show --stat --format= <base branch>..<branch>` must list test files. If the repository ignores `tests/*` in `.gitignore`, test files must be added with `git add -f`.
- Works with **the same number of processes as production**: read the run configuration (Dockerfile, `gunicorn.conf.py`, worker count, celery). Code that writes shared files, caches or shared state (rotating logs, temp files, locks) must be safe with multiple workers running, with a multi-process test where possible.
- Invalid input (corrupt file, missing field, out-of-range value) gets a clear message and never crashes the app.
- No dependency, network service or external model added beyond the task's constraints.
- README or docs updated if how to run, configuration or the API changed.
- Clean diff: no junk files, no debug prints, no mass reformatting.

## Checklist: AI parts (models, features, ranking, thresholds, accuracy)

- Thresholds or parameters must **not be tuned to the exact set used for scoring** (e.g. a threshold set just above the benchmark's highest false score). Require numbers on a **held-out** set (different transformations, never used for tuning), and try a few new inputs nobody has seen.
- Good only on the benchmark but worse on held-out is **Fail**.
- Metrics must be before/after, on the same set, computed the same way.

## Checklist: tests stable across environments

- Quality tests must pass in every valid environment (Python versions, library builds), not only on one machine.
- Thresholds leave a margin based on real measurements across environments, or remove the source of variance (e.g. generate uncompressed test images instead of JPEG).
- A threshold set right at the number measured on one machine is **Fail**.

## Checklist: use it like a real user

- **Test under live conditions, not only on static data**:
  - an API that reads files or state the app itself is writing (logs, caches, uploads, queues): call it **while the app is still writing** (e.g. download a log file being written, several times, with other requests in parallel) and compare byte counts and content returned;
  - code running in multiple processes (gunicorn workers, celery): test with the production worker count, and across worker restarts;
  - if the tests use only static data for these cases, add tests for the changing case.
- Before calling the branch Pass, run the app and try a few typical inputs. Read the output carefully: does it meet the **business goal**, not just the letter of the criterion (e.g. a "Very similar" label on all 5 results makes the label useless, even if the criterion says Pass).

## Output

Review notes in the progress log, and the summary carried into the Merge approval card or self-approval line:

```
Review: <branch> — round <n> — <Pass / Fail>
Tests (Verified by me): <command> → <passed>/<total>, skipped <n> (<reason>)
Test cases exercised: TC1 <command> → <result> | TC2 ... | TCk not verified (<reason>)
Tests in commits: <files from git show --stat>
Findings fixed this round: <file:line — change — why> | none
```

## Quality checklist

- [ ] Tests run by you on the branch; numbers come from that run.
- [ ] Every test case exercised with the app running, or marked "not verified" with a reason.
- [ ] Test files present in the branch commits.
- [ ] Every checklist section above passed.
- [ ] Review time, result and rounds recorded in the progress log.

## Guardrails

**Never**
- Pass a branch on a subagent's or an earlier turn's claims.
- Write Pass for anything you did not run.
- Merge while any finding is open.

**Ask first**
- Accepting a known "not verified" item into the merge (state it in the Merge approval).

## Example

**Request (internal):** review `feature/log-download` before merge.

**Outline:** diff matches the SPEC and boundaries; tests run 38/38 in a temp worktree; app started with 4 gunicorn workers; TC1–TC3 called with `curl` while logs rotate, round 1 finds truncated downloads during rotation (`api/logs.py:42`), fixed with a read-under-lock and a multi-process test; round 2 Pass; Merge approval with the notes above.
