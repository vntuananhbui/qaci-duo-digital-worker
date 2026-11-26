---
name: plain-writing
title: Rewrite for the channel's reader, without machine voice
description: Rewrite a draft for the channel's reader in the owner's voice learned from VOICE_SAMPLES, strip machine-voice patterns, and prove with a before/after check that every number, date, name, quote and source is unchanged.
triggers: plain writing, does not sound like ai, sound human, rewrite this draft, remove ai voice, make it sound natural, rewrite for linkedin, rewrite for facebook
tags: marketing, social-media, writing, voice
license: Unspecified
author: QACI Duo
---

# Rewrite for the channel's reader, without machine voice

Every draft is rewritten for the person who will read it on that channel, in the owner's own voice, and cleaned of
the patterns that make text sound machine-written. The facts do not move.

## When to use

- The last step before any post, script or reply goes to the owner for approval.
- The owner pastes a draft and says "make it not sound like AI".
- **Not for:** checking facts (`fact-check`) or choosing a format (`format-rotation`).

## Inputs

| Input | Required | Default |
|---|---|---|
| The draft and its channel | yes | — |
| Voice samples | no | `marketing/VOICE_SAMPLES/` (posts the owner wrote); none: say the voice is generic until samples arrive |

## Procedure

1. **Learn the voice first.** Read the files in `marketing/VOICE_SAMPLES/` (up to 10). Note in 5 lines: sentence
   length, how posts open, pronouns (we / I), how terms are explained, how posts end. Save it as
   `marketing/VOICE_SAMPLES/VOICE_NOTES.md` and reuse it until samples change.
2. **Rewrite for the reader:**

   | Channel | Reader | Rule |
   |---|---|---|
   | Facebook | office workers | no jargon, or at most 2 terms, each explained the first time it appears |
   | LinkedIn | managers | open with money, time or risk |
   | Instagram | scrolling on a phone | short, visual, one idea |
   | Threads | practitioners | exact terms, no simplifying away the detail |

3. **Strip machine voice.** Remove or rewrite every one of these:
   - "it's not X, it's Y" and other set-up-then-reveal contrasts;
   - a one-line moral at the end;
   - "let's dive in", "in today's world", "here's the thing";
   - forced triplets and numbered "3 lessons" lists;
   - em dashes (use a comma, a full stop or brackets);
   - hype words: game-changer, revolution, revolutionary, unlock, seamless, supercharge, next-level;
   - CAPS for emphasis and emoji used as bullets;
   - a closing question to the reader ("What do you think?");
   - chatbot sign-offs ("Hope this helps", "Happy brewing!").
4. **Run the check script** (save it once to `marketing/scripts/voice_check.py`; run it in the foreground with a
   60-second timeout and wait for it):

   ```python
   import re, sys
   # usage: python3 voice_check.py before.md after.md channel
   before, after, channel = open(sys.argv[1]).read(), open(sys.argv[2]).read(), sys.argv[3]
   BAD = [r"—", r"\bgame[- ]changer", r"\brevolution", r"\bunlock", r"\bseamless", r"let'?s dive in",
          r"\bnot (just )?\w+[^.]{0,40}, (it'?s|but)\b", r"\?\s*\Z", r"^\s*[\U0001F300-\U0001FAFF]", r"\b[A-Z]{4,}\b"]
   problems = [p for p in BAD if re.search(p, after, re.I | re.M if p != r"\b[A-Z]{4,}\b" else re.M)]
   keep = lambda t: sorted(set(re.findall(r"\d[\d.,:/%]*|https?://\S+|\"[^\"]+\"", t)))
   lost = [x for x in keep(before) if x not in after]
   words = len(after.split())
   limits = {"facebook": (80, 200), "linkedin": (150, 250)}
   lo, hi = limits.get(channel, (0, 10**6))
   print("machine-voice hits:", problems or "none")
   print("numbers/links/quotes lost:", lost or "none")
   print("words:", words, "OK" if lo <= words <= hi else f"outside {lo}-{hi}")
   if channel == "threads": print("chars:", len(after), "OK" if len(after) <= 500 else "over 500")
   ```

   *Check:* "numbers/links/quotes lost: none". If anything was lost, put it back exactly as it was. Acronyms that
   are product names may stay in caps; list them in the note.
5. **Compare before/after** for the owner: a short table of what changed and why, and confirm that every number,
   date, name, quote and source is unchanged.

## Output

```markdown
<rewritten text>
---
Voice: <based on n samples | generic, no samples yet>
Changed: <list of edits, one line each>
Kept unchanged: numbers, dates, names, quotes, sources (voice_check: none lost)
```

## Quality checklist

- [ ] VOICE_SAMPLES read before rewriting (or the gap stated).
- [ ] No pattern from step 3 left; script output attached.
- [ ] Every number, date, name, quote and source identical to the input.

## Guardrails

**Never**
- Change a number, date, name, quote or source while rewriting, or add a new claim.
- Edit the text of a post the owner has already approved: a change makes it a new draft that needs approval again.

## Example

**Request:** "Rewrite this draft so it doesn't sound like AI." (a LinkedIn post)

**Response outline:** Voice notes from 6 samples. Opening moved to the cost of stale coffee per month (the number
from FACTS.md). Removed "game-changer", an em dash, a "3 lessons" list and the closing question. Script: no hits,
nothing lost, 212 words. Before/after table.
