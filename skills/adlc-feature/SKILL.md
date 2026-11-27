---
name: adlc-feature
title: "Process: implement a feature"
description: "Feature process run end to end by one agent: SPEC with measurable AC, test and implementation plan, code with tests, self-review, verification, merge and a Completion report."
triggers: "adlc feature, implement feature, build a feature, add a feature, new feature, quy trình: implement feature, làm tính năng"
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Process: implement a feature

You take a feature from the owner's request to a merged, verified result and a Completion report. You do every phase yourself: Specify → Plan → Implement → Verify → Merge → Report. A subagent (Task/Agent) may take part of the implementation, but you keep the plan, the review and the Pass / Fail verdict.

Git and the **base branch** come from the assignment; branch, commit, "open PR" and merge follow `adlc-git-local` (a PR is a work branch you merge yourself). Publishing to GitHub/Azure DevOps or deploying happens only after the merge, per the soul's "Check every prerequisite once before deploying".

Used with: `adlc-approval` (approval cards and self-approval), `adlc-git-local`, `adlc-code-review` (self-review before merge), `adlc-ui-preview` (UI preview before push), `adlc-verify-browser` (UI acceptance), `adlc-report` (progress log and Completion report).

## When to use

- `adlc-triage` classified the work as **feature**: new behavior, a new endpoint, screen, command or capability.
- Also for a feature marked **Small task** by `adlc-triage` (see "Small task" below).

**Not for:** defects in existing behavior (`adlc-bugfix`), dependency/config/cleanup work with no behavior change (`adlc-chore`), comparing options without shipping (`adlc-research`), turning a paper into a prototype (`adlc-paper-prototype`).

## Inputs

| Input | Required | Default |
|---|---|---|
| Feature request from the owner (goal, who it is for) | Yes | — |
| Repository and base branch | Yes | From the assignment; ask if missing, never guess |
| Constraints (deadline, dependencies, allowed technology) | No | None beyond the repository's current stack |
| Small task flag from `adlc-triage` | No | Normal flow |
| `Approval points:` line in the team brief | No | Missing line = auto |

## Procedure

### Specify

1. Open a progress log in `sharedBotFolder/plans/<repo>-<task>/` (`adlc-report`) and record the real time each event happens from now on.
2. **Write the SPEC**:
   - Context and goal (why we are doing this).
   - Scope: in scope / out of scope.
   - Functional requirements numbered R1, R2, …
   - Measurable acceptance criteria AC1, AC2, …, each linked to one or more R.
     - **Each AC must test the business goal**, not an easy technical threshold. Ask: "Could this AC pass while the user is still unhappy?" If yes, rewrite it.
     - **Each AC must be achievable** within the SPEC's own constraints. Never write an AC that contradicts the out-of-scope list (e.g. requiring all 3 labels in one pass when the SPEC forbids changing the labeling rule).
   - Repository, base branch, constraints (deadline, dependencies, allowed technology).
   - `done_when`: "every AC passes, all branches merged, Completion report sent".
3. Send the SPEC to the owner, then pass the **SPEC approval** point (`adlc-approval`: a card when the owner asked for it, otherwise self-approve and log "Self-approved: SPEC — <reason> — <evidence>"). If anything is ambiguous or an AC is unachievable, resolve it now with the owner (`NEEDS INPUT:`), before planning.
   *Check:* every R has at least one AC; every AC is measurable and consistent with scope.

### Plan

4. **Test plan**: each test case has an ID (TC1, TC2, …), steps, expected result, and the AC it checks.
5. **Implementation plan**: split into small parts, as independent as possible. Each part has a description, expected files/modules, branch (`feature/<task>-<part>`), kind (AI / software), and related test cases.
   - **Fix the boundaries between parts up front** (modules, functions, input/output types, endpoints) and record them in the plan, so parts never depend on each other's unfinished work.
   - **Stay within the SPEC.** If a requirement can be read broadly (e.g. "no secrets in logs" read as auditing every log call in the repo), choose the narrowest reading that still passes the AC and list the broader work under "Out of scope, proposed later". Go broader only if the owner agrees at Plan approval.
   - **Default to one branch, worked in order.** Use parallel branches (or parallel subagents) only when the parts are **truly independent**: each builds and runs its own tests on the base branch without the other's branch. If one part imports, calls or tests against the other's code ("B after A merges"), it is **one sequential job**: one branch, one PR. If you split, record in the plan why the parts are independent.
6. Send the plan to the owner, then pass the **Plan approval** point (`adlc-approval`). Implement only once it is approved or self-approved and logged.
   *Check:* every AC is covered by at least one TC; boundaries are written down.

### Implement

7. Work on the planned branch per `adlc-git-local`, within scope and the fixed boundaries. If the scope must change, stop and return to step 3 or 6 with the owner.
8. Write or update tests for exactly the assigned test cases; run them (soul: "Running tests") before moving on.
9. AI parts (models, embeddings, features, matching/ranking, thresholds, accuracy evaluation):
   - include before/after metrics on the same dataset;
   - keep a tuning set and a held-out set separate; never pick a threshold by looking at the set used for scoring;
   - quality tests must be stable across environments (Python versions, library builds); leave a measured margin instead of a threshold tight to the number on your machine.
10. UI changes: before Push approval, preview on the separate desktop per `adlc-ui-preview` (a screenshot of each screen; the owner can Take control).
11. Once committed and tests are green, pass the **Push approval** point (`adlc-approval`), then "open PR" per `adlc-git-local`.

### Verify

12. **Self-review** every branch per `adlc-code-review` (run the tests yourself, exercise every TC under real conditions). Fix any finding on the same branch and review again; record each round in the progress log.
13. After all branches are merged (step 14), run tests per the soul's "Running tests" (correct scope, skip tests needing unavailable services), then **verify** each test case. With a UI, use `adlc-verify-browser`. If a TC fails, fix it and repeat steps 12–14.
   *Check:* each TC has a recorded command and real output, or is marked "not verified" with the reason.

### Merge

14. When review passes and tests are green, pass the **Merge approval** point (`adlc-approval`), then merge per `adlc-git-local`.

### Report

15. **Reopen `adlc-report`** before replying, then send the full Completion report in the conversation where the work was assigned: all sections, every table verbatim, self-checked for completeness. Never send a summary paragraph instead. Include every self-approval line.

## Small task

When `adlc-triage` marks the work as **Small task**, run a lighter flow:
- **One plan file**, `IMPLEMENTATION_PLAN.md`, with the test case table (TC, steps, expected result, AC) and the work parts. No separate test plan.
- **One branch, one PR.**
- **No Plan approval point.** The owner already approved scope at SPEC approval. **Before implementing**, send the owner one message containing the plan's test case table and work parts (branch); "plan written" alone is not enough. Then start immediately, without waiting for a reply. If the plan must go beyond the SPEC, return to the normal flow and pass Plan approval.
- Push approval and Merge approval still apply.
- Still keep the **progress log with real times** (`adlc-report`) as each event happens: work received, plan sent, implementation done, review, merge, verify. The report takes "Time to complete" from it.
- Report using the "Small task" section of `adlc-report` (short form).

If the work turns out bigger than expected (touches 3 or more modules, needs an architecture change, needs parallel branches), tell the owner and switch to the normal flow.

## Output

A merged feature plus the Completion report from `adlc-report`. The plan folder contains:

```
sharedBotFolder/plans/<repo>-<task>/
  SPEC.md                 # R1..Rn, AC1..ACn, scope, done_when
  TEST_PLAN.md            # TC | Steps | Expected | AC   (normal flow)
  IMPLEMENTATION_PLAN.md  # parts, boundaries, branches, out of scope
  progress log            # real-time events, self-approval lines
```

Completion report acceptance table (inside the `adlc-report` template):

```
| AC | Test cases | Result (Pass / Fail) | Evidence (Verified by me / not verified) |
```

## Quality checklist

- [ ] Every AC tests the business goal and is achievable within scope.
- [ ] Every AC is covered by a TC; every TC has a command and real output or "not verified" with a reason.
- [ ] Boundaries were fixed in the plan before implementation.
- [ ] Tests are committed on the branch, not only in the worktree.
- [ ] AI parts report before/after on the same set and results on a held-out set.
- [ ] Every approval point was passed by card or logged as "Self-approved: <point> — <reason> — <evidence>".
- [ ] The Completion report has every section and table from `adlc-report`.

## Guardrails

**Never**
- Implement before SPEC approval and Plan approval (or, for a Small task, before sending the plan message).
- Widen scope beyond the SPEC without the owner's agreement.
- Merge without running the branch's tests and exercising the test cases yourself.
- Use `NEEDS INPUT:` for an approval point; skip a card the owner explicitly requested.
- Push to a remote, publish or deploy before the merge, or without the owner's card.

**Ask first**
- Any change to the SPEC after approval.
- Adding a dependency, network service or external model not allowed by the constraints.
- Switching a Small task back to the normal flow (tell the owner why).

## Example

**Request:** "Add CSV export to the orders page, respecting the active filters."

**Outline of the response:**
1. SPEC: R1 export button, R2 filters applied, R3 column set; AC1 "exported rows equal the rows shown for any filter", AC2 "empty filter result exports a header-only file with a clear message"; out of scope: Excel format. SPEC approval self-approved and logged.
2. Plan: TC1–TC4; one branch `feature/orders-export-api` (endpoint + button, sequential). Plan approval self-approved and logged.
3. Implement with tests, Push approval, self-review per `adlc-code-review` (app started, each TC called with `curl` and in the browser).
4. Merge approval, merge, verify TC1–TC4 with `adlc-verify-browser`.
5. Completion report: AC table all Pass with "Verified by me" evidence, time to complete from the progress log.
