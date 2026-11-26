---
name: fact-check
title: Fact-check a post's claims
description: Turn every product or feature name, date, percentage, amount and law in a post into a claim with a fetched official URL and a verbatim quote, and remove any claim that cannot be sourced.
triggers: fact check, check the claims, verify this post, source the claims, check sources
tags: marketing, social-media, fact-check, sources
license: Unspecified
author: QACI Duo
---

# Fact-check a post's claims

Every specific statement about the outside world in a post is a claim that points to an official page the owner
can open, with the exact sentence that supports it. Claims that cannot be sourced are cut, not blurred.

## When to use

- Before any post, script or reply goes into the approval queue.
- **Not for:** the company's own facts (they come from `brand-facts`, not the web).

## Inputs

| Input | Required | Default |
|---|---|---|
| The draft (`marketing/drafts/<post-id>.md`) | yes | — |
| Leads (URLs from the news scan or topic file) | no | none |

## Before you start: app access

Fetching pages needs the **Exa** app (Composio toolkit `exa`). No app tools at all in your turn: tell the owner in
one sentence to turn on app access (Settings of this bot → Apps) and connect Exa, then end the turn. Load tools
once through `COMPOSIO_SEARCH_TOOLS` and run them with `COMPOSIO_MULTI_EXECUTE_TOOL`.

| Need | Tool |
|---|---|
| Find the official page for a claim | `EXA_SEARCH` with `query: <claim keywords>` and `includeDomains: [<official domain>]` when known |
| Read the page to copy the quote | `EXA_GET_CONTENTS_ACTION`, one URL per call |

## Procedure

1. **List the claims.** Mark every product or feature name, date, percentage, amount, count, price, and law or
   regulation (name, number, article, effective date) in the draft. Each becomes one claim.
   *Check:* numbers inside analogies and "things to do this week" count too.
2. **Find the official source** for each claim: the vendor's documentation or press release, the government or
   regulator's site, the standard's publisher, the company's annual report. A third-party blog or news article is a
   lead: follow it to the source it cites.
3. **Fetch the URL** with `EXA_GET_CONTENTS_ACTION` and copy the supporting sentence **verbatim** into `quote`.
   *Check:* the quote appears in the fetched text character for character (search it). A paraphrase is not a quote.
4. **Decide each claim:** `sourced` (quote found and it says what the post says), `corrected` (the source says
   something different: change the post to match the source), or `removed` (no official source found: delete the
   statement; do not replace it with "many", "about", "recently").
5. **Write `marketing/claims/<post-id>.json`** (layout below) and add `Claims: <n> sourced, <n> corrected, <n>
   removed` to the post note.
6. **Re-read the draft** after the edits; make sure the sentences still read naturally and no unsourced specific is
   left.

*Next:* `plain-writing`, then back to the skill that drafted the post.

## Output

```json
[
  {"claim": "<the exact statement in the post>", "url": "<official url fetched in this run>",
   "quote": "<verbatim sentence from that page>", "status": "sourced|corrected|removed", "checked": "<YYYY-MM-DD>"}
]
```

## Quality checklist

- [ ] Every name, date, number, amount and regulation in the post has a claim entry.
- [ ] Every `url` was fetched in this run; every `quote` is verbatim.
- [ ] No third-party blog is a `url`.
- [ ] Removed claims are gone from the post, not softened.

## Guardrails

**Never**
- Type a URL or quote from memory, or cite a page that was not fetched.
- Publish or queue a post with an unsourced name, date, number or regulation.
- Give legal advice: when a law is mentioned, state only what the official text says and link it.

## Example

**Request:** "Check the claims in Tuesday's LinkedIn post."

**Response outline:** 6 claims found. 4 sourced (vendor docs, government decree page, quotes copied), 1 corrected
(the post said "from July", the decree says "from 1 August 2026"), 1 removed (a market-size percentage found only on
a blog). `claims/<post-id>.json` written; post note updated.
