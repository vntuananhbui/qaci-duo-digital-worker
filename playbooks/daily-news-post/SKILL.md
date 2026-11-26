---
name: daily-news-post
title: Write today's post from the news
description: Once a day, find a qualifying news hook, pick the format from real performance, draft the post with the depth recipe and sourced claims, rewrite it in the owner's voice, log it in NEWS_LOG.md and put it in the approval queue.
triggers: post from the news, today s post, daily post, write today s post, news post, post of the day, daily news post
tags: marketing, social-media, news, writing
license: Unspecified
author: QACI Duo
---

# Write today's post from the news

The daily job. It produces one ready-to-approve post per channel that day, opened with fresh, sourced news (or
honestly labelled as a knowledge post when no news qualifies). It never publishes.

## When to use

- "Write today's post from the news", or the daily routine fires.
- **Not for:** a month of posts (`plan-content-calendar`) or publishing (`publish-social-post`).

## Inputs

| Input | Required | Default |
|---|---|---|
| Channel(s) for today | no | the channels with a **news slot** today in `marketing/CALENDAR.md`; no calendar: Facebook on Mon, Wed and Fri only |
| Brief, facts, pillars | yes | `marketing/BRIEF.md`, `marketing/FACTS.md` (ask once if missing) |

## Procedure

Open each skill named below when you reach it (read its SKILL.md; the exact path is in your Imported skills list).

1. **Check today's slots.** This skill fills the calendar's news slots; it never adds posts beyond the calendar's
   3 per week per channel.
   - A channel with no news slot today gets nothing. When **no channel** has one, reply in one line "No news slot
     today; next: <channel> <date>." and stop (the daily routine does this on most days).
   - The owner asked directly and today has no slot: use the channel's next empty slot this week (say which one); if
     the channel already has 3 posts this week, say so and ask before adding one.
   - In `marketing/QUEUE.md`, a channel that already has a post published or approved for today gets none. A channel
     paused in `marketing/LOG.md` gets a draft but is flagged "paused until <date>".
2. **Find the hook** with `news-hook`. Result: one item that passed the four tests and the pillar it turns to, or
   "no qualifying news".
3. **Pick the format** with `format-rotation` for each channel; with a news item the usual choice is `news`, but the
   rotation rule (at most 2 in a row with the same format) wins.
4. **Draft** with `post-formats` and `expert-knowledge` (one topic file, the 5-step depth recipe). With a news item:
   the first 1–2 sentences are the news, with its date and source; then turn to the pillar. With no news: write a
   knowledge post and say in the note "No qualifying news today (window …); knowledge post."
   *Check:* the news is described with the date it happened, never as "today" or "just now" if it was not.
5. **Company facts** with `brand-facts`; **claims** with `fact-check` (the news item's primary source is claim #1).
6. **Rewrite** with `plain-writing` for each channel's reader; keep lengths from `publish-social-post`.
7. **Log the news** in `marketing/NEWS_LOG.md`, one row: `| <date> | <headline> | <source url> | <pillar> |
   <post-id(s)> |`. Knowledge-only days log `| <date> | none qualified | – | <pillar> | <post-id> |`.
8. **Queue for approval.** Save each draft to `marketing/drafts/<post-id>.md` and add a row to `marketing/QUEUE.md`
   with status `awaiting-approval` (or `blocked` if `[Owner fills` is in it) and the suggested time. Show the owner
   the preview: final text per channel, image brief, the claims list (claim, url, quote), the format reason and the
   facts used. Ask with the ask-user tool: "Approve this exact text for <channel> at <time>?" Approval moves it to
   `publish-social-post`, which asks whether to keep it for <time> (needs the routine "Publish approved posts that
   are due" on) or post it now.

## Output

```markdown
Today's post: <date>
Hook: <headline> (<event date>, <source url>) -> pillar <pillar>   | or: No qualifying news (window …); knowledge post
| Channel | Post id | Format (reason) | Words/chars | Status |
Preview per channel: text, image brief, claims (claim | url | quote), facts used
NEWS_LOG.md: 1 row added
```

## Quality checklist

- [ ] News passed the four tests, or the post says it is a knowledge post.
- [ ] Format reason has real numbers; at most 2 in a row with the same format.
- [ ] Every claim sourced; no `[Owner fills` in a post sent for approval.
- [ ] NEWS_LOG.md row written; QUEUE.md rows added.
- [ ] Nothing was published.

## Guardrails

**Never**
- Publish or schedule without the owner's approval of the exact text.
- Pass old news off as new, or comment on politics.
- Put more than 1 post per channel per day in the queue, or more than the calendar's posts per week.

**Ask first**
- Publishing (always), using a competitor's news critically.

## Example

**Request:** "Write today's post from the news."

**Response outline:** 48-hour scan, one item passes (a coffee price notice from an official export body), turns to the
pillar "smart office habits". Facebook `news` format (best format, median ER 3.4% over 4 posts), LinkedIn
`practitioner` (news used twice in a row). Two drafts with claims, NEWS_LOG row, approval card per channel.
