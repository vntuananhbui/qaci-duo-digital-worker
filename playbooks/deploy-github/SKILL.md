---
name: deploy-github
title: Publish code to the owner's GitHub
description: Push the merged base branch to the owner's GitHub, optionally create a release with build files and list it on FCode Market. Use after the merge when DEPLOY.md selects GitHub.
triggers: deploy github, push to github, publish to the owner's github, create a github release, list on fcode market, đưa code lên github của chủ
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Publish code to the owner's GitHub

You work with local git; this skill **pushes the merged base branch to the owner's GitHub**, creates a release and, optionally, lists the app on FCode Market. It runs after the Merge phase. It does not change application code: if a file is missing (e.g. `fcode.json`, a release workflow), add it through the normal flow (a work branch, tests, merge) first, then come back here.

## When to use

- After the merge, when the owner wants the code on their GitHub, a GitHub release, or an FCode Market listing.
- Also as the prerequisite for `deploy-render` when the git platform is GitHub (Render builds from the owner's GitHub).

**Not for:** Azure Repos (`deploy-azure-devops`), demo deployments (`deploy-render`), local branches and merges (`adlc-git-local`).

## Inputs

You write `DEPLOY.md` in `sharedBotFolder/plans/<repo>-<task>/` after the merge, from what the owner asked for. If an item is unknown, ask the owner; never guess.

| Input (in `DEPLOY.md`) | Required | Default |
|---|---|---|
| Local repository path | yes | — |
| Merged base branch | yes | — |
| GitHub **owner** (user account or organization) | yes | — |
| GitHub **repository name** | yes | — |
| Private or public | no | private |
| Create a release (tag) | no | no |
| List on FCode Market | no | no |
| Render deployment | no | no (see `deploy-render`) |
| **Names** of required environment variables (never values) | if any | — |

## Approval cards (always, even while self-approving)

Pushing data out of the system **always requires a card** through the ask-user tool:
- before **creating a repository** or the **first push** to a repository: the card shows owner/repo, private/public, the number of files and commits to push, and `git diff --stat`;
- before **switching a repository to public**;
- before **creating a release** or **listing on FCode Market**: the card shows the tag and the files to attach.

These cards are separate from the four ADLC approval points and are never skipped. Never use a `NEEDS INPUT:` line for them.

## Connection: the owner's connected GitHub app (primary)

Access and connection should already have been checked once right after writing `DEPLOY.md` (soul, "Check every prerequisite once before deploying" — combined with Render if `DEPLOY.md` needs it, never asked item by item). This section covers how to use the connection, and is the safety net if you open this skill without that combined check.

Use the GitHub tools of the connected app (search for the tool first, then call it; never guess tool names).
- **No app tools at all** in your turn: your app access is disabled (a bot installed from a package starts this way). Tell the owner exactly one sentence: "Please enable app access for {{agent:bot}} and connect GitHub", then end the turn.
- App tools exist but GitHub is not connected: send the **Connect GitHub** card, say in one sentence why it is needed, then end the turn.
- **Never sign in to GitHub through the browser** (a "sign in to github.com" card, the Screen tab, Take control): that hands the whole account to the bot. If GitHub tools are missing, ask the owner to connect GitHub under Apps, or use a PAT (see "Fallback: the owner's PAT"; creating a new repository needs All repositories and Administration Read & write).
- Common tools: create a repository (`GITHUB_CREATE_A_REPOSITORY_FOR_THE_AUTHENTICATED_USER`, `GITHUB_CREATE_AN_ORGANIZATION_REPOSITORY`), get repository info, commit multiple files (`GITHUB_COMMIT_MULTIPLE_FILES`), Git Database (`GITHUB_GET_A_REFERENCE`, `GITHUB_CREATE_A_BLOB`, `GITHUB_CREATE_A_TREE`, `GITHUB_CREATE_A_COMMIT`, `GITHUB_UPDATE_A_REFERENCE`), topics (`GITHUB_REPLACE_ALL_REPOSITORY_TOPICS`), releases (`GITHUB_CREATE_A_RELEASE`, `GITHUB_LIST_RELEASE_ASSETS`), Actions (`GITHUB_CREATE_A_WORKFLOW_DISPATCH_EVENT`, `GITHUB_LIST_WORKFLOW_RUNS_FOR_A_REPOSITORY`).
- A tool reports "not found" or wrong parameters: search for the tool again to get the exact name and parameters, retry once; if it still fails, stop and report the error verbatim.
- 403 "OAuth App access restrictions": the organization blocks third-party apps. Tell the owner: an org admin goes to GitHub → organization → Settings → Third-party access → OAuth app policy to grant access. Never try to work around it.

## Procedure

Run in the local repository, on the merged base branch, with a clean `git status --short`. The file list to push is `git ls-files` (already filtered by `.gitignore`); never push `artifacts/`, downloaded data, `.venv` or secret files.

1. **Write `DEPLOY.md`** with the inputs above, then run the combined prerequisite check (soul, "Check every prerequisite once before deploying").
   *Check:* every required input is filled; no secret value appears in the file.
2. **Target repository**: get the repository info. If it does not exist, create it (after the card) with `private: true` unless `DEPLOY.md` says otherwise, and `auto_init: true`. If the repository already has unrelated history, stop and ask the owner; never overwrite. (Work requested on an existing repository goes through `adlc-git-remote`, not this skill.)
3. **Check sizes before pushing**: `git ls-files -z | xargs -0 ls -l`. The connected app's tools cannot read files from disk: each file's content must be inline in the call, and one call cannot hold a file larger than about 100 KB. Such files are usually generated (a report page with embedded images, images, build output): deal with them **up front** — remove them from the repository and generate them at build time (e.g. a step in the `Dockerfile`) through the normal flow — then push. Never push halfway and report afterwards.
4. **Push the code** to the `main` branch on GitHub:
   - Small repository (up to about 50 text files, under 1 MB in total): one `GITHUB_COMMIT_MULTIPLE_FILES` call, with the message from the last commit of the local base branch.
   - Larger, many files, heavy files (e.g. an HTML page with a few hundred KB of embedded images) or binaries: **always use the Git Database**, never ask for a PAT. Get ref `heads/main` and the current commit; one blob per file (base64); one tree (mode `100644`, or `100755` for executables); a commit whose parent is the current commit; update the ref (no force). Split into batches if there are many files.
   - *Check:* the `heads/main` hash on GitHub, and the file count against `git ls-files | wc -l`.
   - The GitHub history is a new commit; individual local commits are not kept. State this in the report.
5. **Release with build files** (when `DEPLOY.md` asks): the repository must have `.github/workflows/release.yml` (triggered by `workflow_dispatch` with a `tag` input, `contents: write` permission, builds per the README, zips the result, writes `sha256sum` into `SHA256SUMS`, runs `gh release create` with `GITHUB_TOKEN`). If it is missing, add it through the normal flow first. After the card, call `GITHUB_CREATE_A_WORKFLOW_DISPATCH_EVENT` and follow the run for at most 15 minutes (at least 30 seconds between checks); on failure, report with the log.
   *Check:* the release has a zip file (> 0 bytes) and `SHA256SUMS`.
6. **FCode Market** (when asked): the repository root has `README.md` and `fcode.json` (`name`, `slug`, `version`, `description`, `category`, `stack`, `run`, `env` **variable names only**, `createdBy`; add `demo` only when a real link exists); topics `fcode-app`, `qaci-duo` and one app-type topic; a release with files. If the owner gives the market address, check `<market>/api/apps?refresh=1` and `<market>/api/apps/<owner>/<repo>`.
7. **Report**: hand the result to `adlc-report` (deployment section). Numbers and links come from real tool results.

## Fallback: the owner's PAT

Use only when **the owner says they want to use a PAT**, or the owner does not connect GitHub. Large files are not a reason to ask for a PAT: use the Git Database; if a blob call is rejected for size, report the error verbatim to the owner first, and do not ask for a PAT on your own. Call `request_credential` with exactly `label: "GitHub PAT"`, `delivery: "file"`, `reason`: "Fine-grained token: the right account/org and repository, Contents (Read & write), Metadata (Read); add Administration (Read & write) if a repository must be created or topics changed; expiry at most 90 days." Read the token into a variable per command only; never print it or write it to chat, logs, the repository, `git config` or a remote URL:

```bash
PAT=$(cat "<secret file path>")
GIT_AUTH="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$PAT" | base64 | tr -d '\n')"
git remote get-url github 2>/dev/null || git remote add github https://github.com/<owner>/<repo>.git
git -c credential.helper= -c http.extraheader="$GIT_AUTH" push github main
```

Always pass `-c credential.helper=` on every git command that touches GitHub: the machine may have someone else's GitHub account stored (Keychain, credential store); git must use only the token the owner provided for this work.

401/403: tell the owner in one sentence, delete the file with `rm "<secret file path>"`, then call `request_credential` again as above.

## Output

```markdown
### Deployment — GitHub
- Repository: https://github.com/<owner>/<repo> (<private|public>)
- `main` on GitHub: <hash> — <n> files (local `git ls-files`: <n>)
- History: pushed as a new commit; local commits not preserved
- Release: <link> — files: <zip>, SHA256SUMS — sha256: <value> | not requested
- FCode Market: <listing link / API check result> | not requested
- Tools called: <tool names>
- Approval cards: <card — owner's answer>
```

## Quality checklist

- [ ] `DEPLOY.md` written after the merge, no secret values in it
- [ ] Card answered before creating the repository / first push / public switch / release / FCode Market
- [ ] No file over ~100 KB sent through app tools; generated files handled before pushing
- [ ] `heads/main` hash and file count verified against local
- [ ] Release has a non-empty zip and `SHA256SUMS` (if requested)
- [ ] Every link and number comes from a real tool result
- [ ] PAT (if used) never printed or stored; `-c credential.helper=` on every git command

## Guardrails

**Never**
- Force-push, delete a branch or delete a repository on GitHub.
- Sign in to GitHub through the browser.
- Overwrite a repository that has unrelated history.
- Push `artifacts/`, downloaded data, `.venv` or secret files.
- Print, repeat or store a PAT or environment variable value.
- Work around an organization's OAuth app restrictions.

**Ask first** (card through the ask-user tool)
- Creating a repository or the first push.
- Switching a repository to public.
- Creating a release or listing on FCode Market.
- Anything when the target repository already has unrelated history.

## Example

**Request:** "Merged. Put it on my GitHub as `acme/todo-api`, private, with a v1.0.0 release."

**Response outline:** write `DEPLOY.md` (owner `acme`, repo `todo-api`, private, release `v1.0.0`) → prerequisite check (GitHub connected) → repository not found → card "Create acme/todo-api (private) and push 23 files, 1 commit" with `git diff --stat` → approved → create repository, one `GITHUB_COMMIT_MULTIPLE_FILES` → verify hash and 23 files → `release.yml` present → card for release `v1.0.0` → dispatch workflow, follow run → verify zip and `SHA256SUMS` → report with links, hash, sha256 and tools called.
