---
name: adlc-git-local
title: Local git in the ADLC flow
description: "Local git for ADLC: a work branch per task, complete commits, a PR is a branch, and you merge it yourself after review and approval."
triggers: adlc git local, work branch, merge branch, local git, git cục bộ trong luồng adlc
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Local git in the ADLC flow

How you branch, commit, review and merge locally. The exact paths (main repository, worktrees) are in the **Environment** section of your system instructions. Pushing to the owner's GitHub or Azure DevOps happens only after the merge, through `deploy-github` / `deploy-azure-devops`.

## When to use

- Implement, Verify and Merge phases of any ADLC process skill.

**Not for:** work on an existing GitHub or Azure DevOps repository given by link (`adlc-git-remote`), publishing to a remote (`deploy-github`, `deploy-azure-devops`), approval decisions (`adlc-approval`), code review criteria (`adlc-code-review`).

## Inputs

| Input | Required | Default |
|---|---|---|
| Main repository path | Yes | From Environment |
| Base branch | Yes | `main` |
| Task name, part names, branch names from the plan | Yes | — |
| Your DW name (for commit identity) | Yes | — |

## Where work happens

- Planning and merging happen in the **main repository** (base branch `main`).
- Implementation happens in a **separate git worktree** per branch, sharing history with the main repository. A subagent you start for implementation edits only files in its own worktree.
- No `gh`, no push, no new remotes during this flow.

## Procedure

1. **Implement — branch**: from the latest `main`, in the work worktree: `git switch -c <prefix>/<task>-<part> main`.
   - Prefix by work type: `feature/`, `fix/`, `chore/`, `spike/` (research). If the plan names the branch, use exactly that name.
2. **Implement — commit**: small commits with clear messages, **always under your own name** so the report can measure timing:
   `git -c user.name="<your DW name>" -c user.email="<lowercase name>@casanos.local" commit -m "..."`
3. **Push approval**: before marking the branch ready for review ("opening the PR"), go through Push approval (`adlc-approval`). Log the result ("Push approved at <time>" or the self-approval line); without it, do not review the branch.
4. **"Open the PR"** (no GitHub) means: everything committed on the branch, then log in the progress log the branch name, the commit list (`git log --oneline main..HEAD`), a change summary, and the tests run with results.
5. **Verify — review**: `git -C <main repo> log main..<branch>` and `git -C <main repo> diff main...<branch>`. Run the branch without touching the main repository: `git -C <main repo> worktree add ../review-<branch> <branch>`, run the tests there, then `git -C <main repo> worktree remove ../review-<branch>`.
6. **Review fixes**: fix each finding exactly, commit on the **same branch**, never open a new branch. If `main` has moved, `git merge main` into the branch before re-reviewing.
7. **Merge**: only after Merge approval (`adlc-approval`: owner chose Approve, or self-approved and logged). Merge **under your own name**:
   `git -C <main repo> -c user.name="<your DW name>" -c user.email="<lowercase name>@casanos.local" merge --no-ff <branch> -m "Merge <description>"`
   *Check:* when several branches touch the same file, merge one at a time and re-run the tests and re-read the diff after each. Resolve conflicts yourself only when combining two already-reviewed parts; if logic must change, send the branch back to Implement and review it again.

## App ports

Run the app on a dedicated port so parallel runs do not collide: 5000 for your own verification, 5001–5009 for any subagent working in parallel.

## Output

```
Branch: <prefix>/<task>-<part>
Commits: <git log --oneline main..<branch>>
Tests: <command> → <passed>/<total>
Push approval: <owner approved at <time> | Self-approved: Push approval — <reason> — <evidence>>
Merge: <merge hash> (Merge approval: <owner at <time> | self-approved line>)
```

## Quality checklist

- [ ] Branch created from the latest `main` with the right prefix or the plan's name.
- [ ] All commits under your DW name; nothing uncommitted.
- [ ] Push approval done and logged before review.
- [ ] Review run in a separate worktree; worktree removed afterwards.
- [ ] Merge approval done before `merge --no-ff`; tests re-run after each merge.

## Guardrails

**Never**
- Never force-push, push, add a remote or use `gh` in this flow.
- Never merge into `main` before Merge approval.
- Never commit directly on `main`, or edit files outside the branch's worktree.
- Never resolve a conflict by changing logic without re-review.

**Ask first**
- Deleting a branch (always a card, see `adlc-approval`).

## Example

**Request:** Implement the CSV export filter (feature).

**Response outline:** `git switch -c feature/csv-export-filter main`; two commits under the DW name; Push approval self-approved and logged with the diff file; review in `../review-feature-csv-export-filter`, tests 18/18; Merge approval card (owner set `ask owner at merge`) → Approve; `merge --no-ff`, hash logged in the progress log.
