---
name: adlc-git-remote
title: Work on an existing GitHub or Azure DevOps repository
description: "Clone an existing GitHub or Azure DevOps repository from a link, do the work on a dedicated branch, push that branch with the owner's approval and optionally open a pull request. Never touches the base branch."
triggers: "github link, azure devops link, existing repository, clone repo, push to branch, open a pull request, contribute to repo, làm trên repo github, push lên branch"
tags: adlc-craft, internal, github, azure-devops
license: Unspecified
author: QACI Duo
---

# Work on an existing GitHub or Azure DevOps repository

The owner gives a repository link and asks for work on it. You clone it, run the normal ADLC process on a dedicated work branch, then push **that branch** to the same repository and, if the owner wants, open a pull request into the base branch. The repository's maintainers complete the pull request; you never merge on the server and never write to the base branch.

This skill replaces the local-only parts of `adlc-git-local` for this kind of work: branch naming, commits and review stay the same, but there is no local merge into the base branch — the pull request takes its place.

## When to use

- The owner's request contains a GitHub or Azure DevOps repository URL and asks to change code in it (feature, bugfix, chore, research spike).
- The owner names an existing remote branch to continue work on.

**Not for:** publishing a finished local project to a new or empty repository (`deploy-github`, `deploy-azure-devops`), other hosts such as GitLab or Bitbucket (not supported — tell the owner), approval decisions (`adlc-approval`), local-only work (`adlc-git-local`).

## Supported links

| Platform | URL forms | Parsed as |
|---|---|---|
| **GitHub** | `https://github.com/<owner>/<repo>[.git]`, `…/tree/<branch>` | `<owner>`, `<repo>`, optional branch |
| **Azure DevOps** | `https://dev.azure.com/<org>/<project>/_git/<repo>`, `…?version=GB<branch>`, `https://<user>@dev.azure.com/…`, legacy `https://<org>.visualstudio.com/<project>/_git/<repo>` | `<org>`, `<project>`, `<repo>`, optional branch |

Strip any user name before `@` from the URL; never keep credentials in a URL. Use the canonical clone URL: `https://github.com/<owner>/<repo>.git` or `https://dev.azure.com/<org>/<project>/_git/<repo>`.

## Inputs

| Input | Required | Default |
|---|---|---|
| Repository URL | Yes | — (from the owner's message) |
| Base branch | No | Branch in the URL, else the repository's default branch |
| Target branch | No | New branch `adlc/<task>` cut from the base branch |
| Existing branch to continue | No | Only when the owner names it explicitly |
| Open a pull request? | No | Ask with a card after the push (each time) |
| Access | Yes | See "Access" below |

## Access

Request each token **once**, when first needed, with `request_credential` (`delivery: "file"`). Read it into a variable per command, pass it only through `http.extraheader` or a header, always add `-c credential.helper=` to git, and never print it or write it to chat, logs, files, `git config` or a remote URL. Delete the secret file when the task ends. **Never sign in through the browser.**

**GitHub**
- Read: a public repository is cloned anonymously; a private one needs the PAT before cloning.
- Write (push, pull request) always needs the PAT: `label: "GitHub PAT"`, `reason`: "Fine-grained token for <owner>/<repo> only: Contents (Read & write), Metadata (Read), Pull requests (Read & write); expiry at most 90 days."
- The connected GitHub app cannot clone or push a local branch with its history; use it at most to look up repository info or open the pull request if the owner prefers.
```bash
PAT=$(cat "<secret file path>")
AUTH="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$PAT" | base64 | tr -d '\n')"
```

**Azure DevOps**
- Every operation (including clone) needs the PAT; there is no app connection: `label: "Azure DevOps PAT"`, `reason`: "Scope Code (Read & Write) for <org>/<project>; expiry at most 90 days."
```bash
PAT=$(cat "<secret file path>")
AUTH="AUTHORIZATION: basic $(printf ':%s' "$PAT" | base64 | tr -d '\n')"
```

Every git command that touches the remote: `git -c credential.helper= -c http.extraheader="$AUTH" <clone|fetch|push> ...`

## Procedure

1. **Parse the link** using "Supported links". *Check:* the host is `github.com`, `dev.azure.com` or `*.visualstudio.com`; anything else → tell the owner it is not supported and stop. Record the platform in the progress log ("Repository mode: GitHub" / "Repository mode: Azure DevOps").
2. **Clone or refresh** into `sharedBotFolder/repos/<platform>-<owner-or-org>-<repo>` (persistent, outside the plan folder):
   - not present: `git clone <canonical URL> <folder>` (with the auth header when required);
   - present: `git fetch --prune origin` and confirm `git remote get-url origin` is the same repository.
   *Check:* 401/403/404 → GitHub public URL: the repository is private or missing, request the PAT once and retry. Azure DevOps: the PAT lacks scope or the names are wrong — report the exact org/project/repo used and ask the owner to confirm; never guess other names. Still failing → report the error verbatim and stop.
3. **Resolve the base branch**: the branch from the URL, else `git symbolic-ref --short refs/remotes/origin/HEAD` (strip `origin/`). Record repository, base branch and base commit hash in the progress log.
4. **Read the repository's own rules** before any change: `CONTRIBUTING.md`, `AGENTS.md`, PR templates (`.github/pull_request_template.md`, `.azuredevops/pull_request_template.md`, `docs/pull_request_template.md`), commit conventions, branch naming rules, branch policies mentioned in the README, CI pipelines (`.github/workflows/`, `azure-pipelines.yml`). They override the defaults here.
5. **Create the work branch** in a worktree from the fresh base: `git worktree add ../<repo>-<task> -b adlc/<task> origin/<base>` (or the prefix the repository requires; Azure DevOps branch policies often require e.g. `feature/` or `users/<name>/`). To continue an existing branch the owner named: `git worktree add ../<repo>-<task> <branch>` tracking `origin/<branch>`.
6. **Run the process skill** (`adlc-feature`, `adlc-bugfix`, …) as usual: Specify → Plan → Implement → Verify, committing on the work branch under your DW name (`adlc-git-local`, step 2) and reviewing with `adlc-code-review`. *Check:* tests and real-condition verification pass on the branch before going further.
7. **Sync before pushing**: `git fetch origin`; if `origin/<base>` moved, `git merge origin/<base>` into the work branch (never rebase a branch that has been pushed) and re-run the tests. For an existing branch: if `origin/<branch>` has new commits, merge them in and re-test.
8. **Push approval — always a card**, whatever the `Approval points:` line says (it leaves the system). The card shows: platform and repository, target branch (new or existing), base branch, number of commits (`git log --oneline origin/<base>..HEAD`), `git diff --stat origin/<base>...HEAD`, test results. Options: `Approve` / `Request changes`.
9. **Push** only the work branch, never force: `git -c credential.helper= -c http.extraheader="$AUTH" push origin adlc/<task>`. *Check:* a non-fast-forward rejection → fetch, merge, re-test and send the card again; never `--force`. A rejection from a branch policy or push permission → report it verbatim. Verify that `git ls-remote origin adlc/<task>` equals your local `HEAD`.
10. **Pull request — card each time**: "Open a pull request from `adlc/<task>` into `<base>`?" with options `Open PR` / `Draft PR` / `No PR`. On approval, write the body from the repository's PR template (title, summary, linked issue or work item if given, tests run, "Verified by me" evidence) into `<plan folder>/pr.json`, then:
    - **GitHub** — `pr.json` holds `title`, `head` (`adlc/<task>`), `base`, `body`, `draft`:
      ```bash
      printf 'header = "Authorization: Bearer %s"\n' "$PAT" | curl -sS -K - -X POST \
        -H "Accept: application/vnd.github+json" https://api.github.com/repos/<owner>/<repo>/pulls \
        -d @"<plan folder>/pr.json"
      ```
    - **Azure DevOps** — `pr.json` holds `sourceRefName` (`refs/heads/adlc/<task>`), `targetRefName` (`refs/heads/<base>`), `title`, `description` (at most 4,000 characters), `isDraft`:
      ```bash
      printf 'header = "%s"\n' "$AUTH" | curl -sS -K - -X POST -H "Content-Type: application/json" \
        "https://dev.azure.com/<org>/<project>/_apis/git/repositories/<repo>/pullrequests?api-version=7.1" \
        -d @"<plan folder>/pr.json"
      ```
      The PR link is `https://dev.azure.com/<org>/<project>/_git/<repo>/pullrequest/<pullRequestId>`. Never set auto-complete, never add or bypass reviewers or policies.
    A call fails because of a wrong parameter: retry exactly once with corrected parameters; still failing → report the error verbatim.
11. **Report** with `adlc-report`. There is no local merge in this mode: the Merge phase is replaced by "pushed + PR opened (or not)". Clean up: `git worktree remove ../<repo>-<task>`, delete the secret file and `pr.json` if it holds anything sensitive.

## Output

```
### Repository — <GitHub | Azure DevOps>
Repository: <web URL>  (base: <base> @ <base hash>)
Branch: adlc/<task>  → remote hash <hash> (matches local HEAD: yes)
Commits pushed: <n>  (git log --oneline origin/<base>..adlc/<task>)
Tests: <command> → <passed>/<total>
Push approval: owner approved at <time>
Pull request: <URL> (draft: yes/no) | not opened (owner chose No PR)
```

## Quality checklist

- [ ] Platform recorded; base branch and base commit recorded; repository rules and PR template read and followed.
- [ ] Work done on `adlc/<task>` (or the owner-named branch) in a worktree; nothing committed on the base branch.
- [ ] Synced with `origin/<base>` and tests re-run right before pushing.
- [ ] Push approval card answered by the owner before the push; PR card answered before creating the PR.
- [ ] Remote hash verified equal to local `HEAD`.
- [ ] Token never printed or stored; no credentials in any URL; secret file deleted at the end.

## Guardrails

**Never**
- Never push to the base branch, `main`, `master` or any protected branch; never merge or complete a pull request on the server, never enable auto-complete.
- Never force-push, rebase pushed commits, delete remote branches, or create tags/releases in this mode.
- Never change repository settings, branch protection or policies, secrets, service connections, pipelines' settings, webhooks or permissions.
- Never write the token into the remote URL, `git config`, a file in the repository, or any log.
- Never push to a repository other than the one the owner linked (no forks, no mirrors) without asking.

**Ask first**
- Every push (Push approval card) and every pull request (PR card).
- Continuing someone else's existing branch.
- Commits that touch CI definitions (`.github/workflows/`, `azure-pipelines.yml`) — call this out on the Push approval card.

## Example

**Request:** "https://dev.azure.com/contoso/shop/_git/web — the export button downloads an empty CSV when a filter is active. Fix it and open a PR."

**Response outline:** Classified as bugfix (`adlc-triage`), repository mode Azure DevOps. Azure DevOps PAT requested (Code Read & Write). Cloned to `sharedBotFolder/repos/azure-contoso-web`; base `main` @ `3f2a1c9`. Read `CONTRIBUTING.md` (branches must start with `feature/` or `bugfix/`) → branch `bugfix/csv-export-filter`. Failing test reproduces the bug, fix, 42/42 tests, real export verified with `curl`. Push approval card → Approve; pushed, remote hash matches. PR card → Open PR; PR #128 created from the template. Completion report with the commit list, test output and PR link. (A GitHub link follows the same steps, with an anonymous clone for a public repository and the GitHub PAT for the push.)
