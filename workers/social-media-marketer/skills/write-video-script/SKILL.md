---
name: write-video-script
title: Write a short-video script (TikTok, Reels)
description: Write the week's TikTok or Reels script for a person to film, with a hook in the first 2 seconds, one idea, on-screen text and a caption, and queue the finished video like any post when the file arrives.
triggers: tiktok script, reels script, video script, short video, write a script, next week s tiktok, script for reels, short-form video
tags: marketing, social-media, video, tiktok
license: Unspecified
author: QACI Duo
---

# Write a short-video script (TikTok, Reels)

One script per week that a person on the team can film with a phone in under 30 minutes. One idea, said fast,
with sources behind every number.

## When to use

- "Write next week's TikTok script", or a TikTok/Reels slot in CALENDAR.md.
- The owner supplies the filmed video file: queue it for approval and publishing.
- **Not for:** filming, editing, or generating video.

## Inputs

| Input | Required | Default |
|---|---|---|
| Topic or calendar slot | no | the pillar most behind its target share |
| Length | no | 30–45 seconds |
| Who films and where | no | one person at a desk or counter, phone camera |

## Procedure

1. **Pick the idea.** One topic file from `expert-knowledge`; one idea only. Facts from `brand-facts`, claims through
   `fact-check`.
2. **Write the script** (layout below):
   - **Hook in the first 2 seconds:** a line and a visual that make the viewer stay (a surprising sourced fact, a
     visible mistake, a question shown as text). No greeting, no logo first.
   - The 5-step depth recipe compressed: analogy, how it works, a scene, one thing to try, the misconception.
   - **On-screen text** for every beat (most people watch muted), max 7 words per card.
   - Shots a phone can do; no music track named unless the owner has the rights.
   - **Caption** (≤150 characters) and 3–5 hashtags.
3. **Run `plain-writing`** for the spoken lines (spoken, short sentences; no machine voice).
4. **Save** to `marketing/scripts/video-<YYYY-MM-DD>.md` and add a `draft` row to `marketing/QUEUE.md`.
5. **When the video file arrives:** save it to `marketing/videos/`, check it matches the script's caption and claims,
   and hand it to `publish-social-post` (approval of the exact caption and file first). TikTok via app uploads to
   drafts only (`TIKTOK_UPLOAD_VIDEO` with `publish: false`, never `true`); the owner publishes from the TikTok app.

## Output

```markdown
# Video script <week>: <idea>
Length: 35 s | Channel: TikTok, Reels | Pillar: … | Topic: …
| Time | Shot | Spoken line | On-screen text |
|---|---|---|---|
| 0–2 s | close-up of … | "…" | "…" |
Caption: …  Hashtags: …
Claims: claims/<post-id>.json  | Facts used: …
```

## Quality checklist

- [ ] Hook lands in the first 2 seconds; one idea only.
- [ ] On-screen text on every beat; caption ≤150 characters.
- [ ] Every number sourced; no invented customer.

## Guardrails

**Never**
- Publish a video or caption without approval of the exact file and text.
- Script a customer testimonial that the owner has not provided.
- Use music, footage or a person's likeness without the owner confirming the rights or consent.

**Ask first**
- Publishing the video, and featuring an identifiable customer.

## Example

**Request:** "Write next week's TikTok script."

**Response outline:** Pillar "brewing basics" is behind target. 35-second script: hook "You are paying for coffee you
throw away" over a shot of a half-full pot at 4 p.m.; five beats with on-screen text; caption and 4 hashtags; one
sourced claim. Saved and queued as draft.
