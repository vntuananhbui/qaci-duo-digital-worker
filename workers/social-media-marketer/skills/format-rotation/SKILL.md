---
name: format-rotation
title: Choose the post format from real performance
description: Before drafting, read the last 14 days of performance by format and channel, use the best format 70% of the time and a less-used one 30%, at most two posts in a row with the same format on a channel, and write the reason with real numbers.
triggers: format rotation, which format, choose a format, best performing format, format mix
tags: marketing, social-media, analytics, formats
license: Unspecified
author: QACI Duo
---

# Choose the post format from real performance

The format of each post is chosen from measured results, not habit, and the reason is written down with the
numbers so the owner can check it.

## When to use

- Before drafting any post (daily post, calendar item, publish), and when the weekly report proposes next week's mix.
- **Not for:** writing the post (`post-formats`) or pulling the insights for a full report (`social-weekly-report`).

## Inputs

| Input | Required | Default |
|---|---|---|
| Channel | yes | — |
| Today's date | yes | system date |
| Performance data | yes | `marketing/QUEUE.md` published rows with their measured stats; refresh them with the insight tools in `social-weekly-report` when older than 2 days |

## Procedure

1. **Collect the last 14 days** of published posts on this channel from `marketing/QUEUE.md`: format, reach,
   engagements (reactions + comments + shares + saves), engagement rate = engagements / reach.
   *Check:* every number comes from a tool reading or a browser reading recorded in the queue, with its date.
   Missing numbers stay "not measured"; never estimate them.
2. **Score each format** on this channel: the median engagement rate of its posts, and the number of measured posts.
3. **Pick the format** with this rule, kept in `marketing/scripts/rotation.json` as a running count per channel:
   - 70% of posts use the best-scoring format; 30% try a less-used format (the one with the fewest posts in 14 days).
     Use the running count: if fewer than 30% of the last 10 posts on the channel were tries, this post is a try.
   - **At most 2 posts in a row with the same format on one channel** (never 3): if the last two posts on the
     channel used it, pick the next best. This is the one rotation rule; every other skill points here.
   - A format with **fewer than 2 measured posts** has a score that is a hint only: say so, and do not call it best.
   - `deep-dive` only on Facebook and LinkedIn.
4. **Write the reason** in the post note with the real numbers, for example:
   `Format: practitioner (best on LinkedIn: median ER 4.1% over 5 posts, 2026-11-11 to 2026-11-24; last two posts
   were news, landscape).` or `Format: landscape (30% try; 1 measured post, hint only).`

## Output

One line in the post note: `Format: <format> (<best|try|forced by the max-2-in-a-row rule>; <numbers with date range>)`.

## Quality checklist

- [ ] Numbers in the reason come from the queue or tools, with the date range.
- [ ] At most 2 posts in a row with the same format on one channel.
- [ ] Under 2 measured posts is labelled a hint.

## Guardrails

**Never**
- Invent or round up a metric to justify a format.
- Count a post that was not published, or that failed, as measured.

## Example

**Request:** "Which format should today's Facebook post use?"

**Response outline:** Table of formats on Facebook for the last 14 days (posts, median ER). news 3.2% over 4,
landscape 2.1% over 3, practitioner 1 post (hint only). Last two posts: news, news. So: landscape, with the reason
line written into the note.
