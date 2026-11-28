---
name: adlc-report
title: Progress log and Completion report
description: Keep the per-task progress log as events happen and send the owner one Completion report with real numbers, acceptance evidence and self-approvals.
triggers: adlc report, progress log, completion report, report back to owner, nhật ký tiến độ và báo cáo
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Progress log and Completion report

You keep one progress log per task while you work, and finish with a single Completion report to the owner, in the conversation where the work was assigned. There is no intermediate report to anyone else: the Completion report is the only report.

## When to use

- From the moment work is assigned: start the progress log and append to it at every event.
- At the end of the task (Report phase): before replying to the owner, reopen this skill and send the Completion report.

**Not for:** deciding approvals (`adlc-approval`), classifying work (`adlc-triage`), the deployment steps themselves (`deploy-github`, `deploy-azure-devops`, `deploy-render`) — though their results go into the report.

## Inputs

| Input | Required | Default |
|---|---|---|
| Task name and work type (from `adlc-triage`) | Yes | — |
| Size (Small task or normal) | Yes | Normal |
| `IMPLEMENTATION_PLAN.md` in the repo | Yes | Create the progress log section if missing |
| Acceptance criteria and test cases (SPEC / plan) | Yes | — |
| Test output, `git log`, evidence files of the actual runs | Yes | — |
| Deployment results (if any) | No | "not applicable" |

## Procedure

1. **Specify**: when the work arrives, add a `## Progress log` table for the task in the repo's `IMPLEMENTATION_PLAN.md` (plan folder copies live in `sharedBotFolder/plans/<repo>-<task>/`):

   | Time | Event | Branch | Evidence |
   |---|---|---|---|

2. **Every phase**: log each event **at the moment it happens**, never back-filled: work received, each approval asked and its result or each self-approval (`adlc-approval`), plan done, subagent started/finished (if used), branch ready for review, review findings, merge, verification done, deployment steps.
   *Check:* time comes from `date '+%Y-%m-%d %H:%M:%S'`, never guessed.
3. **Merge**: commit `IMPLEMENTATION_PLAN.md` together with the merge.
4. **Report**: collect every number from real data only — the progress log, `git log --all --format='%h %an %ad %s' --date=iso`, test output you ran yourself, evidence files. Anything you could not measure is written "not measured" with the reason; never invent.
5. Fill in the Completion report template (section Output). Remove the curly-brace placeholders. A section that does not apply to the work type (e.g. research has no merge) is written "not applicable"; do not delete the table.
6. **Small task** (triage marked "Size: Small task"): send the summary table, section 3 (Acceptance) and section 4 (Quality). Omit sections 1, 2 and 5 unless review took several rounds or a risk remains; then add exactly that section. Do not paste long test logs: give the command run, passed/total, the number of skipped tests and why.
7. Run the Quality checklist. If a table is missing, take it from the latest report section in `IMPLEMENTATION_PLAN.md`; if it is not there either, produce the missing data (re-run, re-measure) before reporting.
8. Send the **whole** Completion report as your final reply, every table included. Do not send a bullet summary that points to a file; `IMPLEMENTATION_PLAN.md` is only the archive.

## Output

Send in this order:

1. **Conclusion** (2–3 sentences for a busy reader): is the task done, the **completion time**, any risk the owner must decide on.
2. **The full Completion report** below.
3. **Requirement check**, only if anything does not match the request: where it diverges and the decisions the owner must make.

```
# Completion report: {task name} ({work type})

| Item | Value |
|---|---|
| Status | {Done / Partially done / Blocked} |
| Received | {time, from progress log} |
| Completed | {time of last merge or verification, from progress log} |
| Completion time | {total minutes from received to completed} |
| Parts | {done}/{planned} |
| Test cases | {passed}/{total} |
| Review rounds | {total rounds} across {number of branches} branches |
| Commit on base branch | {last merge hash} |
| Self-approved | {each as "Self-approved: <point> — <reason> — <evidence>", or "none"} |

## 1. Parts and progress
| Part | Type | Branch | Started | First commit | Ready for review | Merged | Duration | Review rounds |
|---|---|---|---|---|---|---|---|---|

## 2. Review
| Branch | Round | Main findings | Result |
|---|---|---|---|
(one row per round; for a round that requested changes, state what was changed)

## 3. Acceptance
| Criterion | Test case | How checked | Result | Evidence |
|---|---|---|---|---|
(Result: Pass / Partial / Fail. How checked: automated test / browser / curl. Evidence: command, test count, screenshot path under reports/screenshots/)

### Verified by me
| Command | Real output (masked) |
|---|---|
(anything not run: "not verified — <reason>")

## 4. Quality
| Metric | Value |
|---|---|
| Automated tests | {passed}/{total} ({skipped} skipped — {reason}) |
| {task-specific metric, e.g. top-1/top-3 accuracy} | {value} |

## 5. Risks and remaining work
| Item | Severity | Proposal |
|---|---|---|

## 6. Deployment
| Step | Result | Link / evidence |
|---|---|---|
(GitHub / Azure DevOps push, release, FCode Market, Render; "not applicable" if none)
```

## Quality checklist

- [ ] Summary table present, including "Completion time" and "Self-approved".
- [ ] Tables 1 Parts, 2 Review, 3 Acceptance (with "Verified by me"), 4 Quality, 5 Risks present (or the Small task subset), 6 Deployment when relevant.
- [ ] Every number traced to the progress log, `git log`, or a test run of this task.
- [ ] Every acceptance row has evidence or is marked "not verified".
- [ ] Missing packages installed for tests are listed; skipped tests counted with reason.
- [ ] No secrets: passwords, tokens, keys masked (`password=<redacted>`).
- [ ] Progress log committed with the merge.

## Guardrails

**Never**
- Never back-fill progress log times or guess them.
- Never invent or copy numbers from another run or from memory.
- Never replace the report with a bullet summary or a pointer to a file.
- Never paste secret values or long raw logs.

**Ask first**
- Before reporting a task as Done when an acceptance criterion is Fail or unverified — state it and let the owner decide.

## Example

**Request:** The owner assigned "Add a CSV export that respects the active filter" (feature, Small task); work is merged.

**Response outline:**
- Conclusion: "Done in 47 minutes; the export now respects the active filter. No open risks."
- Completion report: summary table (Received 10:02:11, Completed 10:49:30, Test cases 4/4, Commit on base branch `a1b2c3d`, Self-approved: Plan approval — Small task, plan not needed — n/a; Push approval — 2 commits, 18/18 tests on HEAD — review-feature-csv-export.diff.txt; Merge approval — review passed, 4/4 test cases — same diff).
- Section 3 Acceptance with "Verified by me" (`pytest tests/test_export.py -q` → 18 passed; `curl` against the running app → 12 rows).
- Section 4 Quality: 18/18, 0 skipped.
