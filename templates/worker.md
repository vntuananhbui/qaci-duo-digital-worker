---
# QACI Duo Digital Worker template. A Digital Worker is one bot that carries playbooks from skills/.
# Copy this file to workers/<your-worker>/WORKER.md and set `id` to the folder name. Put the skills only this
# worker carries in workers/<your-worker>/skills/<name>/; a skill other workers also carry lives in skills/<name>/.
id: your-worker
release: 1.0.0
name: Your Worker
title: The worker's role in a few words
tagline: One sentence on the result this worker gets for its user (shown on the Templates card).
description: What the worker does, what evidence it relies on, and what it never does without approval. QACI Duo uses this as the bot's description.
category: Research
author:
  name: Your name
license: MIT
tags:
  - research
color: blue # green, blue, red, orange, purple, cyan, pink, yellow, teal, coral
outcomes:
  - The first result the user gets
  - The second result the user gets
setupMinutes: 5
# Optional: Composio apps the worker uses. `slug` must be the exact Composio toolkit slug (lowercase), e.g. exa,
# github, gmail, deepwiki_mcp, cve_now_mcp, semanticscholar. Check it before you commit; see AGENTS.md, "Declaring
# apps and MCP connections". Never put a key or token here: the owner connects the app in the bot's Settings → Apps.
# apps:
#   - slug: exa
#     label: Exa
#     reason: Searches papers and web pages by meaning.
#     optional: true
playbooks:
  - your-playbook # folder names under skills/
# Optional: a worker can carry more than one agent, a shared room, paused routines, a standing soul, declared MCP
# connections, and whole embedded skills (not just lightweight playbooks). See FORMAT.md and schema/worker.schema.json.
# A worker with none of the fields below behaves exactly as above — this is purely additive.
# soul: Standing system prompt for this worker's own agent (your-worker), under 24,000 bytes.
# skills:
#   - your-skill # folder names under skills/, embedded whole (as SKILL.md) instead of trigger+instructions
# connections:
#   - key: your-connection
#     label: Your Connection
#     reason: Why an agent would use it.
#     mcp: { transport: http, url: "https://example.com/mcp", valueNames: [Authorization] } # a declared slot only, never a secret value
# agents:
#   - key: your-worker-assistant
#     name: Your Worker's Assistant
#     title: A second role on this worker
#     description: What this extra agent does.
#     color: blue
#     soul: Standing system prompt for this one agent, under 24,000 bytes.
#     playbooks: [your-playbook] # subset of playbooks: above; defaults to all of them
#     skills: [your-skill] # subset of skills: above; defaults to all of them
#     connections: [your-connection] # subset of connections: above; defaults to NONE (never handed out unless listed)
# chiefOfStaff: your-worker # one of: this worker's own id, or an agents[].key; defaults to this worker's id
# teamBrief: Shared instructions for the whole team, under 24,000 bytes (becomes the package's team.brief).
# examples: # up to 12 suggested questions, shown on the worker's page
#   - title: A short name for this example (at most 120 characters)
#     input: A realistic request a user would make (at most 4,000 characters)
#     output: An outline of the response — headings and kind of content, not a full transcript (at most 8,000 characters)
# rooms:
#   - key: your-room
#     name: Your Room
#     bulletin: What this shared room is for.
#     members: [your-worker, your-worker-assistant]
#     defaultResponder: { kind: agent, agent: your-worker }
# routines:
#   - key: your-routine
#     name: Your Routine
#     agent: your-worker
#     prompt: What to do each time this routine runs.
#     runOn: duo # duo = where the bot already runs (the team server in research mode); cloud only if cloud computers are configured
#     durationMinutes: 15
#     enabledAfterInstall: false # always false; the user turns it on
#     schedule: { type: daily, time: "09:00", weekdays: [1, 2, 3, 4, 5] } # or { type: cron, expression: "0 8 * * 1-5", timeZone: Asia/Ho_Chi_Minh } or { type: once, at: <epoch ms> }
---

# Your Worker

## Mission

A short paragraph: who this worker serves, the problem it removes, and what "good" looks like for that user.

## Working rules

- **Start by asking** for the inputs the playbooks need; ask once, with all questions together.
- **Pick the playbook** that fits the request:

  | When the user wants to… | Use |
  |---|---|
  | do the main job | `your-playbook` |

- **Evidence:** every claim links to a source the user can open; anything unverified is labelled as such.
- **Approval:** list the actions that wait for the user (sending, submitting, deleting, running costly jobs).
- **Privacy:** never ask for passwords or tokens in chat; use QACI Duo's app connections.

## Completion rule

What a finished answer contains: the result first, then evidence separated from inference, then the decisions that are still the user's.
