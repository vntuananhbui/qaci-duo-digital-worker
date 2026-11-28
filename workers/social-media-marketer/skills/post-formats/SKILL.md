---
name: post-formats
title: Post formats (landscape, news, deep-dive, practitioner)
description: Shape a post as one of four formats (landscape, news, deep-dive, practitioner) with the format's required parts, and tag every post with its format and topic.
triggers: post formats, post format, landscape post, deep dive post, practitioner post, news format
tags: marketing, social-media, writing, formats
license: Unspecified
author: QACI Duo
---

# Post formats

Every post is one of four formats. A fixed shape per format keeps posts comparable, so the weekly report can say
which format works on which channel.

## When to use

- Every time a post or calendar item is drafted.
- **Not for:** choosing which format to use today (`format-rotation`) or the channel's length rules
  (`publish-social-post`).

## Inputs

| Input | Required | Default |
|---|---|---|
| The format chosen by `format-rotation` | yes | — |
| Topic slug (from `expert-knowledge`) | yes | — |
| Channel | yes | — |

## Procedure

1. **Check the format is allowed on the channel.** `deep-dive` is for Facebook and LinkedIn only. On other channels
   pick again with `format-rotation`.
2. **Build the required parts:**

   | Format | Required parts | Claims |
   |---|---|---|
   | `landscape` | One hot problem the audience has; how 3–4 named players (vendors, tools, approaches) solve it; one line on how to choose | exactly one sourced claim per player, from that player's official page |
   | `news` | The news item (from `news-hook`), one keyword it makes important, a plain explanation of that keyword, what it means for the reader | the news item's primary source plus any claim in the explanation |
   | `deep-dive` | Long form: the problem, the full 5-step depth recipe with more room, an example, sources at the end | every specific is sourced |
   | `practitioner` | Real work the company did, real numbers, one mistake made, and the rule it led to | numbers and the story must be in FACTS.md or given by the owner; otherwise `[Owner fills: …]` |

   Apply the 5-step depth recipe from `expert-knowledge` inside every format (shortened where the channel is short).
3. **Tag the post.** First lines of `marketing/drafts/<post-id>.md`:
   `format: <format>`, `topic: <topic-slug>`, `pillar: <pillar>`, `channel: <channel>`.
   *Check:* the tags match one of the four format names exactly.

## Output

```markdown
format: landscape
topic: cold-brew
pillar: product-knowledge
channel: facebook
---
<post text>
---
Note: <format-rotation reason with numbers> | Facts used: … | Claims: …
```

## Quality checklist

- [ ] The format is one of the four and allowed on the channel.
- [ ] Every required part of the format is present.
- [ ] `landscape` has one sourced claim per named player; `practitioner` numbers come from the owner.

## Guardrails

**Never**
- Invent a practitioner story, a mistake, or its numbers.
- Disparage a named player; describe what each does, with its own source.

## Example

**Request:** "Draft a landscape post for LinkedIn on keeping coffee fresh in the office."

**Response outline:** Problem: coffee goes stale within days of opening. Three approaches named (vacuum canisters,
small weekly deliveries, whole-bean grinders), one sourced claim each, a line on how to choose. Tagged
`format: landscape`, `topic: coffee-freshness`.
