---
name: expert-knowledge
title: Expert knowledge library and depth recipe
description: Keep a topic library for the brand's field, one reference file per topic, read only the file for the post's topic, and give every post depth with a 5-step recipe from analogy to a corrected misconception.
triggers: expert knowledge, topic library, depth recipe, knowledge post, explain the topic, add a topic
tags: marketing, social-media, knowledge, writing
license: Unspecified
author: QACI Duo
---

# Expert knowledge library and depth recipe

Posts earn trust when they teach something real. This skill keeps the field knowledge in small topic files and
gives every post the same five-step depth, so posts do not drift into slogans.

## When to use

- Any post, script or expert reply that explains something about the brand's field.
- The owner asks to add or correct a topic.
- **Not for:** facts about the company (`brand-facts`) or checking outside claims (`fact-check`, which still runs
  on every name, date, number and law in the topic file's text that goes into a post).

## Inputs

| Input | Required | Default |
|---|---|---|
| The post's topic | yes | from the calendar item or the news item |
| The target customer (who, where, their working day) | yes | from `marketing/BRIEF.md` |
| A new topic to add, with sources | no | — |

## Procedure

1. **Find the topic file.** The library lives in `marketing/knowledge/`, one file per topic, named
   `<topic-slug>.md` (2–4 words), plus `marketing/knowledge/INDEX.md` listing each topic in one line.
   Read `INDEX.md`, pick one topic, and read **only that file**. Do not load the whole library.
   *Check:* the post's `topic` tag equals the file's slug.
2. **No file for the topic?** Create it: research with the tools named in `fact-check`, write the layout under
   *Output*, every factual line with its source URL. Add the line to `INDEX.md`. Tell the owner a new topic was added.
3. **Write the post body with the 5-step depth recipe,** in this order:
   1. **Everyday analogy:** one picture from ordinary life that maps to the idea.
   2. **How it really works:** 2–4 sentences, accurate, no hand-waving.
   3. **A concrete scene from the target customer's world:** a real-looking moment from their day (place, time, task),
      without inventing a named customer.
   4. **1–3 things the reader can do this week:** specific and small enough to try.
   5. **One common misconception, corrected:** say what people believe and what is actually true, with its source.
   *Check:* all five are present and in order. For short formats (Instagram, Threads, video) each step may be one
   short line, but none is dropped. `landscape` and `news` posts may shorten step 3 to one sentence.
4. **Mark claims.** Every name, date, number or regulation taken from the topic file is passed to `fact-check` with
   the file's source URL as a lead; the post uses only claims that pass.

## Output

Topic file `marketing/knowledge/<topic-slug>.md`:

```markdown
# <Topic>
Updated: <YYYY-MM-DD>
## Core idea (2–4 sentences)
## Analogies that work
## How it really works (with sources)
- <statement>. Source: <url>
## Scenes from the target customer's world
## Things a reader can do this week
## Common misconceptions
- Belief: … / Actually: … Source: <url>
## Keywords and terms (with a plain explanation)
```

## Quality checklist

- [ ] Only one topic file was read for this post.
- [ ] The post contains all five depth steps, in order.
- [ ] Every factual statement from the library went through `fact-check`.

## Guardrails

**Never**
- Give legal advice, medical dosing, or step-by-step attack instructions, even if a topic touches them: explain the
  idea and point to a professional or the official source.
- Present a topic file line without a source as fact.

**Ask first**
- Adding a topic outside the content pillars in `marketing/BRIEF.md`.

## Example

**Request:** "Write a knowledge post about cold brew for office workers."

**Response outline:** Reads `knowledge/INDEX.md`, opens `knowledge/cold-brew.md` only, writes: analogy (tea left
overnight in the fridge), how cold extraction works in 3 sentences, a 3 p.m. scene at a desk, two things to try this
week, and the misconception "cold brew has more caffeine" corrected with its source. Claims go to `fact-check`.
