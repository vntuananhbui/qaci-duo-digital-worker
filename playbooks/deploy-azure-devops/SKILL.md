---
name: deploy-azure-devops
title: Publish code to the owner's Azure DevOps
description: Push the merged base branch to the owner's Azure DevOps (Azure Repos) with a PAT, optionally via a pull request. Composio has no managed Azure DevOps toolkit, so the PAT is the primary method. Use when DEPLOY.md selects Azure DevOps.
triggers: deploy azure devops, push to azure repos, publish to azure devops, đưa code lên azure devops
tags: deploy, git, azure-devops, internal
license: Unspecified
author: QACI Duo
---

# Publish code to the owner's Azure DevOps

This skill pushes the **merged** base branch to the owner's Azure Repos repository. It runs after the Merge phase. It does not change application code: if a file is missing, add it through the normal flow first. FCode Market and GitHub releases are tied to GitHub and do not apply to this platform.

## When to use

- After the merge, when `DEPLOY.md` selects Azure DevOps as the git platform.
- To open a pull request on Azure Repos instead of pushing straight to `main`.

**Not for:** GitHub (`deploy-github`), demo deployments (`deploy-render`), local branches and merges (`adlc-git-local`).

## Inputs

You write `DEPLOY.md` in `sharedBotFolder/plans/<repo>-<task>/` after the merge. If an item is unknown, ask the owner; never guess.

| Input (in `DEPLOY.md`) | Required | Default |
|---|---|---|
| Local repository path | yes | — |
| Merged base branch | yes | — |
| Azure DevOps **organization** | yes | — |
| Azure DevOps **project** | yes | — |
| Azure DevOps **repository name** | yes | — |
| Repository exists or must be created | yes | — |
| Open a pull request instead of pushing to `main` | no | push to `main` |

## Approval cards (always, even while self-approving)

Pushing data out of the system **always requires a card** through the ask-user tool:
- before **creating a new repository** or the **first push**: the card shows organization/project/repo, the number of files and commits to push, and `git diff --stat`;
- before **switching a repository to public** (Azure Repos is visible only to project members by default).

Never use a `NEEDS INPUT:` line for these cards.

## Connection: the owner's PAT (primary, not a fallback)

**Composio has no managed Azure DevOps toolkit for git** — unlike GitHub (where the connected app comes first), this platform always uses the owner's Personal Access Token from the start; there is no "is the app connected" check.

Call `request_credential` with exactly `label: "Azure DevOps PAT"`, `delivery: "file"`, `reason`: "Scope Code (Read & Write); Code (Read, write, & manage) if a new repository must be created; expiry at most 90 days." Read the value into a variable per command only; never print it or write it to chat, logs or the repository:

```bash
PAT=$(cat "<secret file path>")
AUTH="AUTHORIZATION: basic $(printf ':%s' "$PAT" | base64 | tr -d '\n')"
```

Always pass `-c credential.helper=` on every git command that touches Azure DevOps: the machine may have someone else's account stored (Keychain, credential store); git must use only the token the owner provided for this work.

## Procedure

1. **Write `DEPLOY.md`** with the inputs above (no prerequisite to ask in advance for Azure DevOps), then request the PAT as described.
2. **Target repository** (work requested on an existing repository goes through `adlc-git-remote`, not this skill): `curl -s -H "$AUTH" "https://dev.azure.com/<org>/<project>/_apis/git/repositories/<repo>?api-version=7.1"` to check whether it exists. If not and `DEPLOY.md` asks to create it (after the card): `curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" -d '{"name":"<repo>"}' "https://dev.azure.com/<org>/<project>/_apis/git/repositories?api-version=7.1"`.
3. **Push the code** to `main` (after the card for the first push):
   ```bash
   git remote add azure "https://dev.azure.com/<org>/<project>/_git/<repo>" 2>/dev/null \
     || git remote set-url azure "https://dev.azure.com/<org>/<project>/_git/<repo>"
   git -c credential.helper= -c http.extraheader="$AUTH" push azure main
   ```
4. **Verify**: `curl -s -H "$AUTH" ".../refs?filter=heads/main&api-version=7.1"`.
   *Check:* the remote hash equals the local commit.
5. **Pull request** (when `DEPLOY.md` asks for one instead of pushing to `main`): `POST .../pullrequests?api-version=7.1` with body `{"sourceRefName": "refs/heads/<branch>", "targetRefName": "refs/heads/main", "title": "..."}`.
6. A call fails because of a wrong parameter or API path: retry exactly once with corrected parameters; if it still fails, stop and report the error verbatim.
7. **Report**: hand the result to `adlc-report` (deployment section).

### Errors

- 401/403: the PAT expired or lacks scope — report the error verbatim to the owner, `rm "<secret file path>"`, and call `request_credential` again.
- 404 on org/project/repo: report the exact names used from `DEPLOY.md` and ask the owner to confirm; never guess other names.

## Output

```markdown
### Deployment — Azure DevOps
- Repository: https://dev.azure.com/<org>/<project>/_git/<repo>
- `main` on remote: <hash> (matches local: yes/no)
- Files pushed: <n>
- Pull request: <link> | not requested
- Approval cards: <card — owner's answer>
```

## Quality checklist

- [ ] `DEPLOY.md` written after the merge, no secret values in it
- [ ] PAT requested with the exact label; never printed or stored
- [ ] `-c credential.helper=` on every git command touching Azure DevOps
- [ ] Card answered before creating the repository / first push / public switch
- [ ] Remote `main` hash verified against local
- [ ] Errors reported verbatim; no guessed org/project/repo names

## Guardrails

**Never**
- Force-push or delete a repository on Azure DevOps.
- Print, repeat or store the PAT.
- Guess a different organization, project or repository name after a 404.
- Retry a failing call more than once.

**Ask first** (card through the ask-user tool)
- Creating a new repository or the first push.
- Switching a repository to public.

## Example

**Request:** "Merged. Push it to Azure DevOps: org `contoso`, project `Platform`, new repo `billing-api`."

**Response outline:** write `DEPLOY.md` → `request_credential` "Azure DevOps PAT" (Code Read, write & manage, since the repo is new) → GET returns 404 for the repository → card "Create contoso/Platform/billing-api and push 41 files, 1 commit" with `git diff --stat` → approved → create via POST, add remote, push with `-c credential.helper=` → verify `heads/main` hash matches → report the repository link, hash and file count.
