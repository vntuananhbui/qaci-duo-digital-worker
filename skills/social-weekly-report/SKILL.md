---
name: social-weekly-report
title: Weekly social media report
description: For a date range, pull page and post insights from Facebook and Instagram, traffic from Google Analytics and browser readings, and hand back REPORT.md with reach, engagement, top and bottom posts, performance by format, and next week's format mix and 3 actions.
triggers: weekly report, social report, report for last week, which format worked, performance report, how did our posts do, social media report, insights report
tags: marketing, social-media, analytics, report
license: Unspecified
author: QACI Duo
---

# Weekly social media report

A report the team can act on: what reached people, what they engaged with, which format worked on which channel,
and what to change next week. Every number comes from a tool reading with its date range.

## When to use

- "Weekly report for last week: which format worked best?", or the weekly routine fires.
- **Not for:** choosing one post's format (`format-rotation`, which reuses this report's readings).

## Inputs

| Input | Required | Default |
|---|---|---|
| Date range | no | last Monday to Sunday, owner's time zone |
| Channels | no | every channel in BRIEF.md |
| Export to Google Sheets | no | no |

## Before you start: app access

Load the tools once: tool search for `COMPOSIO_SEARCH_TOOLS` and `COMPOSIO_MULTI_EXECUTE_TOOL`, call
`COMPOSIO_SEARCH_TOOLS` for `facebook`, `instagram`, `threads`, `google_analytics`, `googlesheets`, and take
parameter names from the schemas it returns. No app tools at all in your turn: tell the owner in one sentence to turn
on app access (Settings of this bot → Apps) and connect Facebook and Instagram at least, then stop. A single app
missing: its numbers are "not measured (app not connected)"; carry on with the rest.

| Need | Tool |
|---|---|
| Facebook page totals | `FACEBOOK_GET_PAGE_INSIGHTS` (`page_id`, `metrics: "page_total_media_view_unique,page_post_engagements"`, `period: "day"`, `since`, `until`) |
| Facebook posts in range, with engagement | `FACEBOOK_GET_PAGE_POSTS` (`page_id`, `since`, `until`, `fields: "id,message,created_time,permalink_url,reactions.summary(true),comments.summary(true),shares"`): engagements = reactions total + comments total + shares count |
| Facebook post reach | `FACEBOOK_GET_POST_INSIGHTS` (`post_id`, `metrics: "post_total_media_view_unique"`) per post: unique viewers, used as reach |
| Instagram posts in range | `INSTAGRAM_GET_IG_USER_MEDIA` (`ig_user_id: "me"`, `since`, `until` as Unix timestamps), then `INSTAGRAM_GET_IG_MEDIA_INSIGHTS` (`ig_media_id`, `metric: ["reach", "likes", "comments", "shares", "saved", "total_interactions"]`) per post |
| Instagram account totals | `INSTAGRAM_GET_USER_INSIGHTS` |
| Threads (optional) | `THREADS_LIST_MY_POSTS`, `THREADS_GET_POST_INSIGHTS` |
| Website traffic from social (optional) | `GOOGLE_ANALYTICS_LIST_ACCOUNT_SUMMARIES` (property id), `GOOGLE_ANALYTICS_RUN_REPORT` (date range; dimensions `sessionSource`, `sessionMedium`; metrics `sessions`, `engagedSessions`) |
| Export (optional) | `GOOGLESHEETS_CREATE_GOOGLE_SHEET1` (`title`), `GOOGLESHEETS_GET_SHEET_NAMES` (`spreadsheet_id`), `GOOGLESHEETS_SPREADSHEETS_VALUES_APPEND` (`spreadsheetId`, `range` = a sheet name it returned, `values` = rows, `valueInputOption: "RAW"`) |

Meta removed the Facebook post metrics `post_engagements`, `post_impressions`, `post_impressions_unique`,
`post_clicks` and `post_engaged_users` on 15 November 2025: never request them. Facebook engagement comes from the
post's own reaction, comment and share counts. Do not use the deprecated `INSTAGRAM_GET_USER_MEDIA` or
`INSTAGRAM_GET_POST_INSIGHTS`.

## Procedure

1. **Fix the range** (start and end dates, time zone) and write it at the top of every table.
2. **Pull the numbers** with the tools above for every channel with an app. For browser channels, open the
   `browser-posting` skill and read visible stats on each post in range. Save the raw readings to
   `marketing/reports/<start>_<end>/raw.json` with the tool name and time of each reading.
   *Check:* each number in the report traces to one raw reading. Nothing estimated, averaged from memory, or copied
   from an earlier report.
3. **Update `marketing/QUEUE.md`** with each published post's reach and engagements (used by `format-rotation`).
4. **Compute:** per channel reach, engagements, engagement rate (engagements / reach; on Facebook, reach is unique
   viewers from `post_total_media_view_unique`, and the report says so); per format per channel: posts,
   median engagement rate; top 3 and bottom 3 posts by engagement rate (with at least the median reach, so tiny
   posts do not win), each with a reason grounded in the post (format, topic, hook, time) stated as a likely reason,
   not a proven cause.
5. **Operations:** from QUEUE.md, posts that failed (with the exact error) or are still waiting (awaiting-approval,
   blocked on `[Owner fills`); from `marketing/replies/`, replies sent per channel; paused channels from LOG.md.
6. **Next week:** a format mix per channel from `format-rotation`'s rule (70% best, 30% try; a format with <2
   measured posts is a hint) and **3 actions**, each tied to a number in the report.
7. **Write `marketing/REPORT.md`** (also copy to `marketing/reports/<start>_<end>/REPORT.md`), attach it with
   `attach_file`, and export to Sheets only if asked and connected.

## Output

```markdown
# Social report <start> to <end> (<time zone>)
Sources: Facebook insights, Instagram insights, GA4, browser readings (LinkedIn). Read on <date time>.
## Summary
| Channel | Posts | Reach | Engagements | ER | Site sessions from channel |
## Top 3 posts / Bottom 3 posts
| Post | Channel | Format | Reach | ER | Likely reason |
## Performance by format
| Channel | Format | Posts measured | Median ER | Note (hint if <2) |
## Operations
Failed: … (exact error) | Waiting: … | Replies sent: FB 6, IG 3 | Paused: …
## Next week
Format mix: FB news 2, landscape 1 ...
Actions: 1. … (because …) 2. … 3. …
Not measured: <metric> (<reason>)
```

## Quality checklist

- [ ] Every number traces to a raw reading in this range; missing numbers say "not measured".
- [ ] Date range on every table.
- [ ] Formats with <2 measured posts marked as hints.
- [ ] Failed and waiting posts listed; replies per channel counted.
- [ ] 3 actions, each tied to a number.

## Guardrails

**Never**
- Invent, estimate or carry over a metric; never present a likely reason as proven.
- Touch Meta Ads, boost posts, or change page settings.
- Include commenters' personal data in the report.

**Ask first**
- Sharing the report outside the chat (Sheets export to a shared folder).

## Example

**Request:** "Weekly report for last week — which format worked best?"

**Response outline:** Range 17–23 Nov. Facebook 4 posts, reach 3,912, ER 3.0%; Instagram 3 posts; LinkedIn read in
the browser (impressions shown on 2 of 3 posts, 1 "not measured"). Best: `news` on Facebook (median 3.6%, 3 posts);
`practitioner` on LinkedIn has 1 post (hint). Next week's mix and 3 actions. REPORT.md attached.
