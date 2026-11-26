---
name: adlc-chore
title: "Process: maintenance (chore)"
description: "Maintenance process run by one agent for dependencies, configuration and cleanup: baseline tests, scoped change, before/after comparison, merge and a Completion report, with no user-visible behavior change."
triggers: "adlc chore, chore, maintenance, upgrade dependency, bump library, cleanup, refactor, fix flaky test, quy trình: bảo trì"
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Process: maintenance (chore)

You run maintenance work end to end yourself: Specify → Plan → Implement → Verify → Merge → Report. A subagent (Task/Agent) may take part of the change; you keep the baseline, the review and the verdict.

Principle: **user-visible behavior must not change**. If behavior has to change, it is no longer a chore: stop and reclassify with `adlc-triage`.

Git and the **base branch** come from the assignment; branch, commit, "open PR" and merge follow `adlc-git-local`.

Used with: `adlc-approval`, `adlc-git-local`, `adlc-code-review`, `adlc-ui-preview`, `adlc-report`.

## When to use

- `adlc-triage` classified the work as **chore**: dependency upgrades, configuration, cleanup, refactoring with no behavior change, documentation, flaky tests, technical debt, security or performance housekeeping.

**Not for:** new behavior (`adlc-feature`), wrong behavior (`adlc-bugfix`), choosing between options (`adlc-research`).

## Inputs

| Input | Required | Default |
|---|---|---|
| What to do and why (technical debt, security, performance, docs, …) | Yes | — |
| Scope: files/modules | Yes | Ask if unclear |
| Repository and base branch | Yes | From the assignment |
| Task-specific criterion (new library version, flaky test stable over N runs, doc has section X) | No | Behavior unchanged + tests green |
| `Approval points:` line in the team brief | No | Missing line = auto |

## Procedure

### Specify

1. Open the progress log (`adlc-report`). **Describe the work**: what, why, scope (files/modules), risks.
2. Acceptance criteria: all existing tests still green; behavior unchanged; plus the task-specific criterion. Set `done_when`.
3. **Small, low-risk chore**: go ahead and tell the owner in one line. **Large chore** (major library upgrade, multi-module refactor): send the description, then pass the **SPEC approval** point (`adlc-approval`) before planning.

### Plan

4. Run the tests on the base branch and record the result as the **baseline** in `baseline-tests.txt` in `sharedBotFolder/plans/<repo>-<task>/` (reuse an existing base-branch result per the soul's "Running tests"). For a chore that touches shared code (configuration, dependencies, base classes), run the full suite.
5. Plan: usually one branch `chore/<task>`; split into parts only for a large chore. For a large chore, pass the **Plan approval** point (`adlc-approval`).

### Implement

6. Change only what is in scope. Bugs or feature ideas found along the way go into the report as proposed follow-up work, never into this diff.
7. Rerun the tests and compare against the baseline.
8. Once committed and green (UI change: preview per `adlc-ui-preview`), pass the **Push approval** point (`adlc-approval`), then "open PR" per `adlc-git-local`, recording the before/after test results.

### Verify

9. **Self-review** per `adlc-code-review`, plus:
   - the diff is within scope, with no new features or bug fixes mixed in;
   - all tests still green, **no test deleted, disabled or loosened** to make it pass;
   - library upgrades: read the changelog's breaking changes and run the tests in every valid environment.

### Merge

10. Pass the **Merge approval** point (`adlc-approval`), merge, and run the tests once more. Compare to the baseline: same number of tests, same results (except flaky tests if fixing them is the task).
    *Check:* any difference from the baseline is explained or the chore is not done.

### Report

11. **Reopen `adlc-report`** and send the full Completion report. The Quality section records the before/after test results.

## Output

```
Chore: <what> — why: <reason> — scope: <files/modules>
Baseline (base branch): <passed>/<total>, skipped <n> — source: baseline-tests.txt
After merge:            <passed>/<total>, skipped <n> — source: <command/file>
Differences: <none | explained list>
Task criterion: <criterion> — Pass / Fail — Verified by me: <command + output>
Follow-ups found (not done): <list or none>
```

All of this sits inside the `adlc-report` Completion report.

## Quality checklist

- [ ] Baseline recorded before any change.
- [ ] Diff contains only the chore; no behavior change.
- [ ] Same test count and results as the baseline after merge; no test removed, disabled or loosened.
- [ ] Breaking changes read for every upgraded library.
- [ ] Approval points passed by card or logged as self-approved.

## Guardrails

**Never**
- Change user-visible behavior under a chore.
- Delete, disable or loosen a test to get green.
- Mix bug fixes or features into the chore diff.

**Ask first**
- A large chore (major upgrade, multi-module refactor) before starting.
- Any change that turns out to affect behavior (reclassify).

## Example

**Request:** "Bump `requests` to the latest version."

**Outline of the response:** one-line notice to the owner (small, low risk); baseline 214/214 saved to `baseline-tests.txt`; branch `chore/bump-requests`, changelog checked for breaking changes; Push approval; self-review; Merge approval; after merge 214/214; Completion report with the before/after table.
