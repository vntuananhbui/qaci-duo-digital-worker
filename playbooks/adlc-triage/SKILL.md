---
name: adlc-triage
title: Classify the task
description: Classify work the owner assigns (feature, bugfix, research, chore, paper-prototype), judge whether it is a Small task, and open the matching process skill.
triggers: adlc triage, classify task, what kind of work is this, new task, phân loại task
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Classify the task

The first step of every piece of work the owner assigns (`/dw` = the owner assigns work): decide the work type and size, tell the owner, then run the matching process skill yourself from Specify through Report.

## When to use

- Every new piece of work the owner assigns in the direct chat.
- When a follow-up turns out to be a separate piece of work.

**Not for:** the process itself (`adlc-feature`, `adlc-bugfix`, `adlc-research`, `adlc-chore`, `adlc-paper-prototype`), approvals (`adlc-approval`), reporting (`adlc-report`).

## Inputs

| Input | Required | Default |
|---|---|---|
| The owner's request | Yes | — |
| Repository and base branch | Yes | Ask the owner if missing. A GitHub URL (`https://github.com/<owner>/<repo>`) or Azure DevOps URL (`https://dev.azure.com/<org>/<project>/_git/<repo>`) means repository mode **GitHub** / **Azure DevOps**: use `adlc-git-remote` instead of the local merge |
| Reproduction steps (bugfix) | For bugfix | Ask the owner |
| Paper link / attached PDF / QACI Data search (paper-prototype) | For paper-prototype | Ask the owner |

## Work types

| Type | Signals | Process skill |
|---|---|---|
| **feature** | A new capability, screen or behavior that did not exist before | `adlc-feature` |
| **bugfix** | The system behaves **wrongly** compared with expected or previously correct behavior; there is (or you can find) a way to reproduce it | `adlc-bugfix` |
| **research** | A question to answer before deciding: comparing options, a survey, a feasibility experiment. The result is a **recommendation**, not product code | `adlc-research` |
| **chore** | Maintenance that **does not change behavior**: refactoring, dependency upgrades, cleanup, docs, fixing flaky tests | `adlc-chore` |
| **paper-prototype** | The owner provides a **research paper** (arXiv link/URL, attached PDF, or a paper found through the QACI Data tools when connected) and wants a **working prototype** reproducing the paper's core method at small scale | `adlc-paper-prototype` |

## Small task

Besides the type, judge the size. A **Small task** meets all three conditions:
- one repository;
- changes one clear area (one module, a few endpoints, one screen, one configuration);
- no change to architecture or shared data, and it can be finished in one session.

Examples: add one API, write logs to a file, add a filter, fix a bug that has reproduction steps. `paper-prototype` never uses the Small task size: it always follows every step of `adlc-paper-prototype`.

For a Small task:
- the SPEC is short: goal, requirements, AC, out of scope; at most about one page;
- record at the top of the progress log and plan: "Work type: feature. **Size: Small task.** Process: skill adlc-feature (section Small task)".

When unsure, treat it as normal size.

## Procedure

1. Read the task. Establish what **result** the owner actually wants.
2. Pick one type from the table. For mixed work (e.g. a bugfix plus a feature):
   - split into several tasks if the parts are independent;
   - otherwise pick the main type and write the remaining part explicitly into the requirement.
3. If information is missing to classify or to write the requirement (e.g. a bug report without reproduction steps, unclear repository, a paper without a clear link or file), **ask the owner**; do not guess.
4. Judge the size (section Small task).
5. Tell the owner: work type, a one-sentence reason, the skill you will use.
6. If the request contains a GitHub or Azure DevOps repository link, record "Repository mode: GitHub (`adlc-git-remote`)" or "Repository mode: Azure DevOps (`adlc-git-remote`)" too; the process skill then clones, pushes a branch and opens a PR instead of merging locally.
7. Record the type and skill at the top of the progress log (`adlc-report`) and the plan folder `sharedBotFolder/plans/<repo>-<task>/`, e.g. "Work type: bugfix. Process: skill adlc-bugfix." or "Work type: paper-prototype. Process: skill adlc-paper-prototype."
8. Open that process skill and run it end to end yourself: Specify → Plan → Implement → Verify → Merge → Report. *Check:* reread the skill now; do not work from memory of a previous run.

## Work that fits no type

Quick questions, administrative work, and anything that needs no code change: answer the owner directly, without the ADLC flow. Requests to build, fix or refactor code, or to build a prototype, always go through ADLC, however small (see "Direct assignments" in your system instructions).

## Output

```
Work type: <feature | bugfix | research | chore | paper-prototype>. Size: <Small task | normal>.
Reason: <one sentence>.
Process: skill <adlc-…>.
done_when: <what "done" means>
```

## Quality checklist

- [ ] Exactly one main type chosen; mixed work split or the remainder written into the requirement.
- [ ] Size judged; paper-prototype never Small task.
- [ ] Missing information asked of the owner, not guessed.
- [ ] Type, reason and skill told to the owner and recorded in the progress log.
- [ ] Goal, scope, repository, relevant files/branches and `done_when` stated.

## Guardrails

**Never**
- Never guess a repository, base branch or reproduction steps.
- Never mark paper-prototype work as a Small task.
- Never skip the ADLC flow for a code change, however small.

**Ask first**
- When the request could reasonably be two types with different outcomes (e.g. "investigate and fix" with no reproduction).

## Example

**Request:** "The export button downloads an empty CSV when a filter is active. Fix it."

**Response outline:** "Work type: bugfix. Size: Small task. Reason: existing export behaves wrongly under a filter and can be reproduced. Process: skill adlc-bugfix. done_when: export with an active filter contains the filtered rows." Then log it and run `adlc-bugfix`.
