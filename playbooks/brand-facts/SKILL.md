---
name: brand-facts
title: Brand facts (FACTS.md)
description: Keep one fixed FACTS.md of what may be said about the company and check every draft against it, so only listed facts reach a post and anything missing is marked [Owner fills] and blocks publishing.
triggers: brand facts, facts md, company facts, what can we say, owner fills, update facts
tags: marketing, social-media, brand, facts
license: Unspecified
author: QACI Duo
---

# Brand facts (FACTS.md)

The company's own claims (products, prices, numbers, customers, history) come from one file the owner controls:
`marketing/FACTS.md`. A post may say only what is on that list. This keeps the worker from inventing a customer,
a number or a feature that sounds plausible.

## When to use

- Setting up the worker for a new company, or the owner says "update our facts".
- Every time any skill drafts a post, a script or a reply that says something about the company.
- **Not for:** facts about the outside world (news, laws, other vendors): those are claims checked by `fact-check`.

## Inputs

| Input | Required | Default |
|---|---|---|
| Product or service names, what each does | yes (first setup) | — |
| Prices, offers, numbers the company may publish | no | none: no price or offer may appear in a post |
| Customers or partners that agreed to be named | no | none: no customer is named |
| History (founded, team size, locations) | no | not mentioned |
| Words or claims never to use (legal, brand) | no | none |

## Procedure

1. **Open or create `marketing/FACTS.md`.** If it does not exist, ask the inputs above once and write it in the
   layout under *Output*. Each fact is one line with an ID (`F01`, `F02`, …), the fact, and where the owner said it
   (date, "owner in chat" or a document name).
   *Check:* nothing is in the file that the owner did not give or confirm. Never fill a line from the website or from
   memory without the owner confirming it.
2. **Check a draft.** List every statement in the draft about the company (product names, features, prices,
   discounts, numbers, customers, testimonials, dates, team, awards). For each one, find the matching fact ID.
3. **Mark the gaps.** A statement with no matching fact is replaced by `[Owner fills: <what is needed>]`, for example
   `[Owner fills: number of subscribers]`. Do not soften it into "many customers": vague is still invented.
4. **Record the result** in the post's note: `Facts used: F03, F07` and `Owner fills: 1` (or 0).
   *Check:* a post with any `[Owner fills` left in it has status `blocked` in `marketing/QUEUE.md` and is never
   published, scheduled or sent for approval as final copy.
5. **Update FACTS.md** only when the owner gives a new fact or confirms a change. Keep the old line, mark it
   `(replaced by Fxx, <date>)`. Tell the owner which lines changed.

## Output

```markdown
# FACTS.md: <company>
Last confirmed by the owner: <YYYY-MM-DD>
Content stage: expertise-only | posts with offers   (changing it needs the owner's approval)

## Products
- F01 <product>: <what it does>. Source: owner in chat, <date>
## Prices and offers (only these may be published)
- F05 ...
## Numbers we may publish
- F08 ...
## Customers and partners who agreed to be named
- F12 ...
## History
- F15 ...
## Never say
- N01 ...
```

## Quality checklist

- [ ] Every company statement in the draft has a fact ID or an `[Owner fills: …]` marker.
- [ ] No price, discount or offer appears unless it is in FACTS.md and the content stage allows offers.
- [ ] No customer, testimonial or number was added from memory or the web.

## Guardrails

**Never**
- Invent or round a company number, customer, testimonial, award or price.
- Publish or queue as final a post that still contains `[Owner fills`.
- Promise a discount or price that is not in FACTS.md.
- Store customers' personal data in FACTS.md.

**Ask first**
- Any change to FACTS.md, and switching the content stage (for example from expertise-only to posts with offers).

## Example

**Request:** "Write a Facebook post saying 2,000 offices already use our coffee subscription."

**Response outline:** Checks FACTS.md, finds no subscriber count, writes the draft with
`[Owner fills: number of offices using the subscription]`, sets the post to `blocked`, and asks the owner for the
real number and whether it may be published.
