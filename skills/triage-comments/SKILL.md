---
name: triage-comments
title: Triage comments and draft replies
description: Read new comments on every channel, group them as question, complaint, praise or spam, draft short replies for the owner's approval, flag complaints for a human, and send approved replies within rate limits.
triggers: comment triage, triage comments, reply to comments, answer comments, new comments, in the comments, draft replies, what are people saying
tags: marketing, social-media, community, replies
license: Unspecified
author: QACI Duo
---

# Triage comments and draft replies

Keeps up with what people say under the posts. It groups every new comment, drafts short, specific replies, and
sends nothing until the owner approves the exact words.

## When to use

- "What are people saying in the comments this week? Draft replies." or the owner pastes comments.
- **Not for:** direct messages to people who did not write first, or posting new content.

## Inputs

| Input | Required | Default |
|---|---|---|
| Period | no | since the last triage in `marketing/replies/`, else the last 7 days |
| Channels | no | every channel in BRIEF.md |
| Pasted comments | no | none |

## Before you start: app access

Load the tools once (tool search for `COMPOSIO_SEARCH_TOOLS` and `COMPOSIO_MULTI_EXECUTE_TOOL`; call
`COMPOSIO_SEARCH_TOOLS` for `facebook`, `instagram`, `threads`; take parameter names from the schemas). No app tools
at all: say so in one sentence (Settings of this bot → Apps) and work only from pasted comments and browser channels.

| Need | Tool |
|---|---|
| Facebook comments | `FACEBOOK_GET_PAGE_POSTS`, then `FACEBOOK_GET_COMMENTS` per post |
| Facebook reply | `FACEBOOK_CREATE_COMMENT` on the comment's id |
| Instagram comments | `INSTAGRAM_GET_IG_USER_MEDIA` (`ig_user_id: "me"`), then `INSTAGRAM_GET_IG_MEDIA_COMMENTS` (`ig_media_id`) per post |
| Instagram reply | `INSTAGRAM_POST_IG_COMMENT_REPLIES` (`ig_comment_id`, `message`: at most 300 characters, 4 hashtags, 1 link) |
| Threads replies (optional) | `THREADS_LIST_POST_REPLIES`; reply with `THREADS_CREATE_REPLY` |
| Browser channels | read and reply with `browser-posting` |

## Procedure

1. **Collect** new comments per channel since the last triage: comment id, post, text, time. Keep only the public
   name shown; store no other personal data.
2. **Group** each comment: `question`, `complaint`, `praise`, `spam` (spam, ads, abuse, scams).
3. **Draft replies** (1–3 sentences, in the commenter's language, in the owner's voice via `plain-writing`):
   - Thank the person for what they actually said (name the point), never a generic "thanks for your comment".
   - Expert questions: answer briefly from one `expert-knowledge` topic file; any specific number or rule is sourced
     with `fact-check`, or left out.
   - Company questions (price, delivery, availability): answer only from FACTS.md; otherwise say the team will
     follow up, and flag it.
   - **Complaints:** no ready-to-send answer; flag for a human with a suggested next step.
   - **Spam, ads, abuse:** no draft; list them so the owner can decide.
   - Politics, legal or medical questions: a polite line pointing to a professional or official source, flagged.
4. **Ask for approval** with the ask-user tool, per batch: show each comment and its exact draft; options per item:
   Approve / Edit / Skip.
5. **Send approved replies** exactly as approved: app channels with the reply tools; browser channels with
   `browser-posting`. Limits for browser sending: **max 5 per run, 10 per day per channel, 1–3 minutes apart**.
   Approved replies over the limit wait for the next run.
6. **Record** in `marketing/replies/<YYYY-MM-DD>.md`: comment id, group, draft, status (sent / waiting / skipped /
   flagged), link.

## Output

```markdown
# Comments <period>
| Channel | Questions | Complaints | Praise | Spam |
## Needs a human (complaints and flagged)
- <channel> <post> "<comment>" -> suggested next step
## Draft replies for approval
| # | Channel | Comment | Group | Draft reply |
## Spam / abuse (no reply drafted)
Sent after approval: FB 4, IG 2 | Waiting for next run: 1
```

## Quality checklist

- [ ] Every new comment grouped; complaints flagged, spam left without a draft.
- [ ] Each draft is 1–3 sentences and mentions what the person said.
- [ ] Nothing sent without approval; browser limits held.
- [ ] No personal data kept beyond the public name and comment.

## Guardrails

**Never**
- Send a reply without the owner's approval of the exact text, or message anyone who did not write first.
- Delete, hide or report a comment, or like comments.
- Promise refunds, discounts or prices not in FACTS.md; give legal advice; comment on politics.
- Collect phone numbers, emails or addresses from commenters.

**Ask first**
- Every reply, and any action on a complaint.

## Example

**Request:** "What are people saying in the comments this week? Draft replies."

**Response outline:** 23 comments: 9 questions, 2 complaints, 8 praise, 4 spam. Two complaints flagged with a
suggested next step. 15 drafts in a table for approval. After approval, 10 replies sent via the apps and 5 queued
through the browser for LinkedIn (5 per run limit).
