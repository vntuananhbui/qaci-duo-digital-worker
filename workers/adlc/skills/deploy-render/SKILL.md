---
name: deploy-render
title: Deploy a demo to Render
description: Deploy an app from the owner's GitHub repository to Render and return a working demo link, with cost estimate and how to stop it. Use after the merge when DEPLOY.md includes Render.
triggers: deploy render, deploy demo to render, create a demo link, host the app on render, deploy demo lên render
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Deploy a demo to Render

This skill takes an app **already on the owner's GitHub** (skill `deploy-github`) to Render and returns a working demo link. It runs after the Merge phase and after `deploy-github`. It does not change application code: if the repository cannot run on Render, fix it through the normal flow (a work branch, tests, merge, push) first.

## When to use

- After the merge, when the owner wants a shareable demo link and `DEPLOY.md` includes Render.
- To redeploy a new version to an existing Render service.

**Not for:** pushing code to GitHub (`deploy-github`) or Azure Repos (`deploy-azure-devops`), local previews (`adlc-ui-preview`), browser verification (`adlc-verify-browser`).

## Inputs

You write the Render section of `DEPLOY.md` (in `sharedBotFolder/plans/<repo>-<task>/`) after the merge. If an item is unknown, ask the owner; never guess.

| Input (in `DEPLOY.md`) | Required | Default |
|---|---|---|
| GitHub repository (owner/repo, branch) | yes | — |
| Start command, or a `Dockerfile` | yes | — |
| **Port** the app listens on (the app must read `PORT`) | yes | — |
| **Health path** (e.g. `/health`) | yes | — |
| **Names** of environment variables | if any | — |
| **Persistent disk** (mount path, e.g. `/data`, for SQLite or long-lived files) | no | none; size 1 GB if needed |
| Render owner (when the owner has several) | if several | the only owner |
| Desired cost limit | no | — |
| One demo flow to exercise | yes | — |

## Before you start

App access, Connect Render and the reminder to grant Render's GitHub app should already have been asked once, combined, right after writing `DEPLOY.md` (soul, "Check every prerequisite once before deploying"). The items below are the safety net if you reach the Render step with one still missing — still ask, but combine everything missing into one message; never ask one item after another.

- The repository must run on Render by itself: a `Dockerfile`, or clear build/start commands, and the app listens on `0.0.0.0:$PORT`. If not, add it through the normal flow; never patch it here.
- **Never ask the owner for a Workspace/Owner ID**: Render has tools to look up the owner's own owner (`List Owners`/`Retrieve Owner`); use them in the first step, never guess, never ask.
- Render reads GitHub through **Render's own GitHub app** on the owner's account, separate from the GitHub connected in QACI Duo. If the repository is private and that app has no access, Render does not see the repository. Put this step in the **first approval card**: "github.com/apps/render/installations/new → choose the account/org that owns the repository → Repository access: add `<repo>` (or All repositories) → Save", so the owner does it before you create the service.
- Render authenticates with an **API Key**, not an OAuth sign-in: the owner creates a key under Render Dashboard → Account Settings → API Keys and pastes it into the **Connect Render** card when it appears in QACI Duo (never into chat).

## Approval cards (always, even while self-approving)

A deploy **costs money** and **exposes the app**, so it always requires a card through the ask-user tool:
- before **creating the service and the first deploy**: the card shows the repository and branch, the compute plan, whether there is a persistent disk, and an **estimated cost** (compute is a fixed monthly plan, not hourly: about $7/month for 0.5 CPU/512 MB, $25/month for 1 CPU/2 GB; a persistent disk is about $0.25/GB/month; **free instances cannot attach a persistent disk**, so SQLite or long-lived files require a paid plan of at least $7/month);
- before **switching the service to public** or adding a custom domain beyond the default `*.onrender.com`;
- before **redeploying** a new version to a running service.

Never use a `NEEDS INPUT:` line for these cards.

## Connection

Use the Render tools of the connected app (search for the tool first, then call it).
- No app tools at all: tell the owner exactly one sentence, "Please enable app access for {{agent:bot}} and connect Render", then end the turn.
- App tools exist but Render is not connected: send the **Connect Render** card (the owner pastes an API key created in the Render Dashboard), then end the turn.
- **Never sign in to Render through the browser** (the Screen tab, Take control): that hands the whole account to the bot. If tools are missing, ask the owner to connect the app with an API key.
- Common tools: `RENDER_LIST_OWNERS`, `RENDER_RETRIEVE_OWNER`, `RENDER_CREATE_BUILD_SOURCE`, `RENDER_CREATE_SERVICE`, `RENDER_ADD_DISK`, `RENDER_UPDATE_DISK`, `RENDER_LIST_DISKS`, `RENDER_UPDATE_ENVIRONMENT_VARIABLES_FOR_SERVICE`, `RENDER_TRIGGER_DEPLOY`, `RENDER_LIST_DEPLOYS`, `RENDER_RETRIEVE_DEPLOY`, `RENDER_CANCEL_DEPLOY`, `RENDER_ROLL_BACK_DEPLOY`, `RENDER_LIST_LOGS`, `RENDER_LIST_SERVICE_EVENTS`. Wrong name or parameters: search for the tool again, retry once; if it still fails, report the error verbatim.

## Procedure

1. **Owner**: call `List Owners` (or `Retrieve Owner` if the id is known from a previous run) to get the owner id yourself — never ask, never guess. With several owners (personal + org), pick the one `DEPLOY.md` names; if it names none, ask the owner to choose.
2. **Build source + service**: look for a service named after the repository; if none, `Create Build Source` pointing at the exact GitHub repository/branch, then `Create Service` (web service) with the owner id and build source (after the card). Record the service id.
3. **Persistent disk** (when `DEPLOY.md` needs one): `Add Disk` with the mount path exactly as in `DEPLOY.md` (e.g. `/data`), size 1 GB unless stated otherwise. If the service is on the free plan, tell the owner a paid plan is needed first (part of the approval card; never upgrade yourself).
4. **Environment variables**: for each variable **name** in `DEPLOY.md`, request the value with `request_credential` (secure input, `delivery: "file"`, `label` exactly the variable name), read the file and pass the value directly to `Update Environment Variables for Service`. The value travels only through that call: never print it, repeat it in a message, or write it to the repository, `DEPLOY.md`, the progress log or the report (the report lists only the variable names set). `PORT` is provided by Render; never set it by hand.
5. **Follow build and deploy**: `Trigger Deploy`, check status with `List Deploys`/`Retrieve Deploy` for at most 20 minutes, at least 30 seconds between checks. On failure, read `List Logs` and report the error part verbatim (e.g. missing `Dockerfile`, wrong port, out of memory); never patch code here — fix through the normal flow, then redeploy (with a card).
6. **Domain**: Render assigns a free `*.onrender.com` domain as soon as the service is created; no separate step is needed.
   *Check:* `curl -s -o /dev/null -w "%{http_code}" https://<domain>/<health path>` returns 200, and exactly one demo flow from `DEPLOY.md` returns a valid result. A custom domain requires a card first.
7. **fcode.json**: once a real link exists, add `demo: "https://<domain>"` to `fcode.json` through the normal flow, then push the new version to GitHub with `deploy-github`.
8. **Report**: hand the result to `adlc-report` (deployment section), then ask the owner with a card whether to suspend the service right after the demo.

## Output

```markdown
### Deployment — Render
- Demo link: https://<domain>
- Service id: <id> — owner: <owner id>
- Deployed GitHub commit: <hash> (matches `main` on GitHub: yes/no)
- Health check: <path> → HTTP <code>; demo flow: <flow> → <result>
- Compute plan: <plan>; persistent disk: <mount path, size> | none
- Estimated cost: ~$<n>/month
- Environment variables set (names only): <NAME_1>, <NAME_2>
- How to stop charges: suspend service `<id>` in Render → service → Settings, or delete it after the owner agrees
- Approval cards: <card — owner's answer>
```

## Quality checklist

- [ ] Owner id looked up with tools, not asked or guessed
- [ ] Render GitHub app reminder included in the first approval card
- [ ] Card answered before service creation / public switch / custom domain / redeploy, with cost estimate
- [ ] Disk only on a paid plan; plan never upgraded by me
- [ ] Secret values only passed through the env-var tool call; report lists names only
- [ ] Health path returns 200 and one demo flow works
- [ ] Report states the monthly cost and how to suspend; suspend card sent

## Guardrails

**Never**
- Upgrade the workspace plan (Hobby/Pro/Scale), add a payment card, buy a domain, or enable paid resources beyond the approved plan.
- Delete a service or disk; suspend only when the owner agrees.
- Sign in to Render through the browser.
- Print, repeat or store an environment variable value or API key.
- Set `PORT` by hand or patch application code in this skill.

**Ask first** (card through the ask-user tool)
- Creating the service and the first deploy (with cost estimate).
- Switching to public or adding a custom domain.
- Redeploying to a running service.
- Choosing among several Render owners when `DEPLOY.md` names none.
- Suspending the service.

## Example

**Request:** "Give me a demo link for `acme/todo-api`; it uses SQLite at `/data`."

**Response outline:** after `deploy-github`, add the Render section to `DEPLOY.md` (Dockerfile, port from `PORT`, `/health`, disk `/data`, env `SECRET_KEY`) → `List Owners` → card: repo/branch, Starter plan ~$7/month + 1 GB disk ~$0.25/month (free plan cannot attach a disk), plus the Render GitHub app step → approved → build source, service, disk → `request_credential` for `SECRET_KEY` → trigger deploy, follow up to 20 minutes → `/health` 200, demo flow OK → add `demo` to `fcode.json` via the normal flow and `deploy-github` → report with link, cost and how to suspend → card asking whether to suspend after the demo.
