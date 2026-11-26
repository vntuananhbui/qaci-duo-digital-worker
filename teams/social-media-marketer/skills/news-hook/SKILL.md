---
name: news-hook
title: Pick today's news hook
description: Scan the last 24–48 hours of news (72 on Mondays) on the brand's fixed search phrases and pick one item that passes four tests, or say plainly that no news qualifies and a knowledge post is due.
triggers: news hook, scan the news, today s news, news for a post, what is in the news, pick a news item
tags: marketing, social-media, news, research
license: Unspecified
author: QACI Duo
---

# Pick today's news hook

A daily post opens with something that happened this week and then turns to the content pillar that is due. This
skill finds that one news item, or proves there is none. It never passes old news off as new.

## When to use

- Every daily post (`daily-news-post`) and any time the owner asks "what is in the news for us?".
- **Not for:** checking the claims inside the post (`fact-check`) or writing the post (`daily-news-post`).

## Inputs

| Input | Required | Default |
|---|---|---|
| Fixed search phrases (5–15) | yes | `marketing/BRIEF.md`, section *News search phrases*; ask the owner once if missing |
| Target audience | yes | `marketing/BRIEF.md` |
| Content pillars and their target share | yes | `marketing/BRIEF.md` |
| Today's date and time zone | yes | the system date; time zone from BRIEF.md, else ask |

## Before you start: app access

Searching needs the **Exa** app (Composio toolkit `exa`) connected and enabled for you (a bot installed from a
package starts with app access off).
- No app tools at all in your turn: tell the owner in one sentence to turn on app access (Settings of this bot →
  Apps) and connect Exa, then end the turn.
- Load the tools once: tool search for `COMPOSIO_SEARCH_TOOLS` and `COMPOSIO_MULTI_EXECUTE_TOOL`, call
  `COMPOSIO_SEARCH_TOOLS` for `exa`, then run tools through `COMPOSIO_MULTI_EXECUTE_TOOL`, batching calls. Take
  parameter names from the schema it returns; never guess them.

| Need | Tool |
|---|---|
| Recent news on a phrase | `EXA_SEARCH` with `query: <phrase>`, `category: "news"`, `startPublishedDate: <window start, ISO 8601>`, `numResults: 10` |
| Read an article or the primary source | `EXA_GET_CONTENTS_ACTION`, one URL per call |

If a tool is missing or fails, write that in the scan log and stop: never fill the gap from memory.

## Procedure

1. **Set the window.** 48 hours back from now; **72 hours on Mondays** (to cover the weekend). Write the exact start
   and end time in the scan log.
2. **Search each fixed phrase** with `EXA_SEARCH`. Keep every result whose published date is inside the window.
   *Check:* the date comes from the article itself (byline or metadata read with `EXA_GET_CONTENTS_ACTION`), not
   from the search snippet. No readable date: drop it.
3. **Group results about the same event.** For each group, find the primary source (the vendor's announcement, the
   government notice, the company's press release) and read it.
4. **Apply the four tests** to each candidate, in order, and record pass or fail with a reason:
   1. **Fresh:** the event itself (not just the article) happened inside the window.
   2. **Sourced:** a primary source, or 2 independent reputable outlets that did not copy each other. Third-party
      blogs and aggregators are leads only.
   3. **Matters to the target audience:** one sentence on what changes for them.
   4. **New to us:** the headline and event are not already in `marketing/NEWS_LOG.md` (search the log for the
      event's key names).
5. **Pick one.** Among items that pass all four, choose the one that best leads into the next content pillar due
   (the pillar furthest below its target share in the last 14 days of `marketing/QUEUE.md`). Write the turn: one
   sentence from the news to that pillar.
6. **No item passes?** Say so plainly: "No news passed the four tests today (window <start>–<end>)." The day's post
   becomes a knowledge post on the due pillar. Never use an older item and never call it new.
7. **Write the scan log** to `marketing/news/<YYYY-MM-DD>.md` (layout below).

*Next:* `daily-news-post` drafts the post; it logs the chosen item in `NEWS_LOG.md` when the draft is queued.

## Output

```markdown
# News scan <YYYY-MM-DD>
Window: <start> to <end> (<48|72> h)  Phrases searched: <n>  Results in window: <n>
| Candidate | Event date | Primary source | Fresh | Sourced | Matters | New | Result |
|---|---|---|---|---|---|---|---|
Picked: <headline>, <primary source url>, pillar next due: <pillar>
Turn: <one sentence from the news to the pillar>
(or) No qualifying news: knowledge post on <pillar>.
```

## Quality checklist

- [ ] Window is 48 h (72 h on Monday) and written down.
- [ ] Every candidate has an event date read from the source, not the snippet.
- [ ] The pick passed all four tests; its primary source URL was opened.
- [ ] No-news days say so; nothing old is presented as new.

## Guardrails

**Never**
- Present an item older than the window as news, or rewrite an old item's date.
- Pick political news, or news about a private individual.
- Use a third-party blog as the source.

**Ask first**
- Using a news item about a competitor by name in a critical way.

## Example

**Request:** "Scan the news for today's post." (Monday)

**Response outline:** 72-hour window, 8 phrases, 31 results in window, 5 candidates in a table with the four tests.
Picks a government notice on office working hours (primary source opened), turns it to the pillar "healthy work
habits", writes `news/<date>.md`, hands over to `daily-news-post`.
