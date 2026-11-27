---
# QACI Duo playbook template. One SKILL.md is one capability of a Digital Worker.
# Copy this folder to skills/<your-playbook>/ and set `name` to the folder name.
# Every field stays on ONE line; separate list items with commas; quote a value that contains ": ".
# Never put tokens, passwords, personal data or internal links in a playbook.
name: your-playbook
title: Your playbook title
description: One sentence saying what the worker achieves with this playbook and what it hands back.
triggers: phrase a user would say, another phrase, a short keyword
tags: research
license: MIT
author: Your name
---

# Your playbook title

One or two sentences: the outcome this playbook produces and who it is for.

## When to use

- The situations where the worker should pick this playbook.
- **Not for:** nearby requests that belong to another playbook, and which one.

## Inputs

Ask for these before starting. Do not guess a required input; ask once, with all questions together.

| Input | Required | Notes |
|---|---|---|
| The main thing the user must provide | yes | What a good answer looks like |
| Context that improves the result | no | The default when it is missing |

## Procedure

1. **First step.** What to do, concretely enough that someone else could repeat it.
   - Detail, tool or source to use.
   - *Check:* how the worker knows this step is done correctly.
2. **Second step.** …
3. **Review before handing back.** Run the quality checklist below.

## Output

Hand back exactly this shape:

```markdown
## <Result title>

<Short answer first: two or three sentences.>

| Column | Column |
|---|---|
| … | … |

**Verified:** what was checked against a source.
**Needs your decision:** what the user must decide or approve.
```

## Quality checklist

- [ ] Every claim has a source the user can open, or is marked as an assumption.
- [ ] The output answers the user's actual question first.
- [ ] Nothing in the Guardrails section was done without approval.

## Guardrails

- **Never:** actions the worker must not take at all (invent sources, delete data, …).
- **Ask first:** actions that need the user's explicit approval (sending, submitting, running costly jobs, …).

## Example

**Request:** "A realistic request a user would make."

**Response outline:** the headings and the kind of content the worker returns.
