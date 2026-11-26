---
name: adlc-bugfix
title: "Process: fix a bug"
description: "Bugfix process run end to end by one agent: triage automated alerts, bug report, reproduce, failing test first, root-cause fix, verify, merge and a Completion report."
triggers: "adlc bugfix, fix a bug, fix bug, bug report, error alert, regression, quy trình: sửa lỗi, sửa lỗi"
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Process: fix a bug

You take a bug from report (or automated alert) to a merged, verified fix and a Completion report, doing every phase yourself: Specify → Plan → Implement → Verify → Merge → Report. A subagent (Task/Agent) may write the fix, but you own the root cause, the review and the verdict.

Principles: **an automated alert is not yet a bug** (locate and check it first, step 1), **never fix a bug you have not reproduced**, and **the work is not done without a test that catches exactly this bug**.

Git and the **base branch** come from the assignment; branch, commit, "open PR" and merge follow `adlc-git-local`.

Used with: `adlc-approval`, `adlc-git-local`, `adlc-code-review`, `adlc-ui-preview`, `adlc-verify-browser`, `adlc-report`.

## When to use

- `adlc-triage` classified the work as **bugfix**: existing behavior is wrong (crash, wrong data, data loss, broken flow).
- An automated error arrives (log, alert, webhook) and must be checked before anything is fixed.

**Not for:** new behavior (`adlc-feature`), failures caused by configuration, environment or external services with no code defect (`adlc-chore` or operations), open questions needing comparison (`adlc-research`).

## Inputs

| Input | Required | Default |
|---|---|---|
| Symptom: what the user sees, where | Yes | — |
| Numbered reproduction steps with concrete input (file, values) | Yes | For an alert: the command/input in the alert; otherwise ask the reporter |
| Expected vs actual result | Yes | — |
| Repository and base branch | Yes | From the assignment; ask if missing |
| Traceback / logs / running version (commit, environment) | No | Collected in step 1 |
| `Approval points:` line in the team brief | No | Missing line = auto |

## Procedure

### Specify

1. **Automated error (log, alert, webhook): locate and check it first.** An alert is only a **suspected bug**. Until this step concludes, create no branch and write no test. Record each result in the progress log (`adlc-report`).

   **a. Locate: where is it, which area**
   - Read the traceback from the frame **in the team's own code** closest to the error (skip library and runtime frames): file, function, line.
   - Match the file to a repository from the assignment (e.g. `casanos-fe`, `casanos-be`, `casanos-ai`). If it cannot be matched (library, infrastructure, external service), record "outside the team's code".
   - Area: UI, API, data, AI or infrastructure. AI-area fixes follow the AI rules in `adlc-code-review`.
   - `git log -n 5 -- <file>` and `git blame -L <line>` to find which commit or PR introduced that line. If the error appeared right after a PR, record that PR (regression signal).
   - Compare the version running when it failed (commit, environment) with the head of the base branch.

   **b. Check: is it a real bug?**
   1. **Duplicate?** Same error signature (error type + file:line) already has a `fix/…` branch, an open PR or a plan in the plans folder? Then merge it into that work, note it there, and stop.
   2. **Already fixed?** Rerun the reproduction on the **head of the base branch**. If it no longer fails, find the fixing commit, reply "fixed in <commit>", and stop.
   3. **Reproducible?** Run the exact command or input from the alert **3 times**. If it never fails: "not reproduced yet" — record what you tried, ask for more data (input, surrounding logs), and stop. If it fails intermittently, record "flaky" and find the triggering condition.
   4. **Correct or wrong behavior?** Compare against the README, SPEC, existing tests or past behavior. For example: invalid input rejected with a clear message is **correct**, not a bug; a crash, a traceback shown to users, wrong data or data loss is **a bug**.
   5. **Code or environment?** Missing configuration or environment variables, full disk, network, a dead external service, or dirty data from another source is not a code bug: classify as `chore` or operations, tell the owner, and do not open a code-fix flow.
   6. **Severity:** how often, how many users or features affected, any data loss, on the scale Critical / High / Medium / Low.

   **c. Conclude** with one of: **Real bug** / Not a bug (reason) / Duplicate of … / Fixed in … / Not reproduced yet. Anything other than **Real bug**: log it, tell the owner, stop, create no branch.
2. **Write the bug report** (it is the SPEC for this work):
   - Symptom: what the user sees, where.
   - Numbered reproduction steps with concrete input.
   - Expected result and actual result.
   - Severity: Critical (blocks users, loses data) / High / Medium / Low, with the reason.
   - Impact: who, which features.
   - For an alert: error signature, location (repo, file:line, area), suspected commit or PR, and the six check results from step 1b.
   - Acceptance criteria: AC1 = following the reproduction steps gives the expected result; further ACs = related behavior is not broken.
   - `done_when`: "reproduced, a test catches the bug, fixed and merged, existing tests still green, Completion report sent".
   If reproduction steps are missing, ask the reporter (`NEEDS INPUT:`) before going on.
3. **Critical** severity: tell the owner as soon as you have it. Any severity: send the bug report, then pass the **SPEC approval** point (`adlc-approval`). When it goes to the owner as a card, offer "Approve, fix" / "Don't fix" / "Need more information"; continue only on **Approve, fix**. When self-approved, log "Self-approved: SPEC — <reason> — <evidence>". **Exception — automated alerts:** when the bug came from step 1 (log, alert, webhook), this point is always sent to the owner as the **Bug confirmation** card (same three options), whatever the `Approval points:` line says; an alert nobody has confirmed is never self-approved.

### Plan

4. **Reproduce** on the current base branch, following the steps exactly. If it does not reproduce, record what you tried, ask the owner or reporter, and do not fix.
5. **Write the bug-catching test first**: an automated test that fails on the current base branch because of exactly this bug. Record the command and the red result.
6. **Find the root cause**: where and why, not just the symptom. Write it in the plan (`sharedBotFolder/plans/<repo>-<task>/`). Check whether the same kind of defect exists elsewhere.
7. Plan the fix: usually one branch `fix/<task>`, the root cause, the bug-catching test, and `done_when` for the branch: "bug-catching test turns green, all existing tests still green". Pass the **Plan approval** point (`adlc-approval`).
   *Check:* the test is red on the base branch for the stated reason, not for an unrelated error.

### Implement

8. On the new branch, run the bug-catching test yourself and see it **red** before fixing.
9. Fix the root cause with the smallest possible scope. If the root cause turns out different from step 6, update the plan before any large change.
10. Rerun: the bug-catching test is **green**, all existing tests are still green.
11. Once committed and green (UI change: preview per `adlc-ui-preview`), pass the **Push approval** point (`adlc-approval`), then "open PR" per `adlc-git-local` recording the cause, the fix, and the test red → green.

### Verify

12. **Self-review** per `adlc-code-review`, plus:
    - the fix targets the root cause, not just the symptom (e.g. catching and swallowing the exception);
    - the bug-catching test is **red before the fix and green after**: run it yourself on the old base branch and on the branch;
    - no behavior change outside the bug's scope.
    Fix findings on the same branch and review again.

### Merge

13. Pass the **Merge approval** point (`adlc-approval`), then merge. **Re-verify using exactly the reproduction steps** (UI: `adlc-verify-browser`), and run the tests per the soul's "Running tests" to confirm no regression.

### Report

14. **Reopen `adlc-report`** and send the full Completion report. The Quality section records: the bug-catching test (name, red → green), the root cause in one sentence, and the full test results. Include every self-approval line.

## Output

```
Bug: <signature or symptom> — Severity: <Critical/High/Medium/Low>
Location: <repo> <file:line> (<area>) — suspected cause: <commit/PR or none>
Check results: duplicate <no> | already fixed <no> | reproduced <3/3> | behavior <wrong> | code/env <code> | severity <reason>
Root cause: <one sentence>
Bug-catching test: <test id> — base: Fail (red) → branch: Pass (green) — command: <cmd>
Full tests: <passed>/<total>, skipped <n> (<reason>) — source: <command/file>
AC1 (repro steps): Pass — Verified by me: <command + output>
```

All of this sits inside the `adlc-report` Completion report.

## Quality checklist

- [ ] For an alert, all six checks are recorded before any branch exists.
- [ ] The bug was reproduced on the base branch before fixing.
- [ ] The bug-catching test is committed on the branch, red before and green after, run by you.
- [ ] The fix addresses the root cause; similar defects elsewhere were checked.
- [ ] Existing tests are still green; none deleted, disabled or loosened.
- [ ] Reproduction steps re-run after merge, with real output.
- [ ] Every approval point passed by card or logged as self-approved.

## Guardrails

**Never**
- Fix an alert before locating and checking it, or fix anything you could not reproduce.
- Merge without a test that catches exactly this bug.
- Hide a symptom (swallow an exception, special-case the input) instead of fixing the cause.
- Change behavior outside the bug's scope.
- Open a code-fix flow for an environment or external-service failure.

**Ask first**
- A root cause that requires an architecture change or touches 3 or more modules (consider reclassifying as feature).
- Missing reproduction steps or data (ask the reporter).
- Fixing related defects found elsewhere (propose them as separate work).

## Example

**Request:** "Export button downloads an empty CSV when a filter is active."

**Outline of the response:**
1. Bug report: steps (open orders, filter status=paid, click Export), expected rows = 12, actual 0; severity High; AC1 repro gives 12 rows, AC2 unfiltered export unchanged. SPEC approval self-approved and logged.
2. Reproduced 3/3; test `test_export_respects_filter` red on `main`; root cause: export query ignores the filter params.
3. Branch `fix/export-filter`, test green, full tests green; Push approval; self-review (red on old base, green on branch).
4. Merge approval, merge, repro re-run gives 12 rows.
5. Completion report with the red → green test, root cause sentence and test totals.
