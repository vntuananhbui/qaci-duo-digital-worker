---
name: browser-posting
title: Post and reply through the browser
description: For channels without an API connection, post owner-approved items and send approved replies through the worker's browser exactly as approved, read comments and visible stats, and stop and pause a channel at any security check.
triggers: browser posting, post in the browser, post through the browser, personal profile post, linkedin without api, read stats in the browser
tags: marketing, social-media, browser, publishing
license: Unspecified
author: QACI Duo
---

# Post and reply through the browser

Some channels have no API connection (a personal profile, LinkedIn without app access). For those, the worker uses
its browser like a careful assistant: it pastes exactly what the owner approved and does nothing else.

## When to use

- Publishing an approved post, or sending approved replies, on a channel marked `browser` in `marketing/BRIEF.md`.
- Reading comments and visible post stats on such a channel for `triage-comments` or `social-weekly-report`.
- **Not for:** channels with a connected app (use the app's tools in `publish-social-post`), or anything not on the
  three-action list below.

## Inputs

| Input | Required | Default |
|---|---|---|
| The approved item (`marketing/approved/<post-id>.md`) and its media | yes, to post | — |
| The approved replies | yes, to reply | — |
| Channel and profile URL | yes | `marketing/BRIEF.md` |

## The only three actions allowed

1. Post an approved item.
2. Send an approved reply.
3. Read comments and visible post stats.

Nothing else: no likes, follows, connection requests, group joins, messages to anyone first, or profile and settings
changes.

## Procedure

1. **Check the channel is not paused.** Read `marketing/LOG.md`. A pause entry less than 7 days old: do not open
   the channel; report the pause and its end date.
2. **Open the browser** (the bot's built-in browser, or the desktop browser of its computer). No browser tool in your
   turn: tell the owner the channel needs the browser turned on, and stop.
3. **Sign-in.** If the site asks to sign in, stop and ask the owner to sign in themselves in that browser window
   (request sign-in with the ask-user tool). Never type a password, one-time code or recovery answer.
4. **Post an approved item:**
   - Open the compose box. Paste the **exact** text from `marketing/approved/<post-id>.md` (copy from the file, not
     from memory). Attach the exact approved media file(s).
   - Before pressing Post, compare the composer text with the file. *Check:* identical, including line breaks and
     hashtags. If the site changed it (shortened link, auto-tag), stop and tell the owner.
   - Post. Open the new post, copy its link into `marketing/QUEUE.md` (status `published`, time).
5. **Send approved replies:** at most **5 per run** and **10 per day per channel**, waiting **1–3 minutes** between
   replies (vary the wait). Paste each reply exactly as approved, under the comment it answers. Record each in
   `marketing/replies/<YYYY-MM-DD>.md`.
6. **Read comments and stats:** read only what is visible on the page (reactions, comments, reposts, impressions if
   shown). Record each number with the date and "browser reading". What is not shown is "not measured".
7. **Stop on any warning.** On a CAPTCHA, a security check, "temporarily blocked", "unusual activity", a removed post,
   or any request to verify identity:
   - stop all actions on that channel at once; do not try to solve or bypass it;
   - copy the exact message;
   - add to `marketing/LOG.md`: `<date time> | <channel> | PAUSED until <date + 7 days> | "<exact message>"`;
   - tell the owner the channel is paused and what was shown.

## Output

```markdown
Channel: <channel> (browser)
Posted: <post-id> -> <post link>  | or: nothing posted, reason
Replies sent: <n> (today on this channel: <n>/10)
Readings: <post link> reactions <n>, comments <n>, ... (browser reading, <date>)
Warnings: none | "<exact message>" -> paused until <date> (LOG.md)
```

## Quality checklist

- [ ] The posted text and media are byte-for-byte the approved ones.
- [ ] Reply limits held: ≤5 per run, ≤10 per day per channel, 1–3 minutes apart.
- [ ] No action outside the three allowed.
- [ ] Any warning stopped the channel and was logged with the exact message.

## Guardrails

**Never**
- Type passwords, one-time codes or recovery answers; solve or bypass a CAPTCHA or security check.
- Like, follow, connect, join groups, message anyone first, or change profile or settings.
- Post or reply with anything other than the exact approved text; edit an approved post after posting.
- Delete a post or comment.

**Ask first**
- Every post and every reply (the approval is the owner's OK on the exact text), resuming a paused channel early,
  and adding a new channel.

## Example

**Request:** "Publish Tuesday's post on my LinkedIn profile."

**Response outline:** LinkedIn is `browser` in BRIEF.md and not paused. The approved file exists. Browser opens,
LinkedIn asks to sign in, so the owner is asked to sign in. Text pasted, compared, posted, link saved to QUEUE.md.
