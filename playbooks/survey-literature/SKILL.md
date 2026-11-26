---
name: survey-literature
title: Survey the literature and check novelty
description: Survey a field or check an idea's novelty from papers that were searched, verified against registries and read in full, and hand back SURVEY.md with located numbers, testable gaps and a brief the Experiment Designer can use directly.
triggers: survey, literature, papers, related papers, survey literature, literature review, find related papers, related work, survey a field, has this been done, is my idea novel, novelty check, check my references, verify citations, summarise this paper, map the field, state of the art
tags: research, survey, literature, novelty
license: Unspecified
author: QACI Duo
---

# Survey the literature and check novelty

Runs a literature request as a short chain of skills that hand off through files, so every paper in `SURVEY.md` was found by a search, verified against a registry and, where it matters, actually read. The result is for a researcher who needs to know where the field stands, whether their idea is new, and what an experiment would have to beat.

## When to use

- Survey a field or write related work; "has anyone done X?"; check a reference list; summarise one paper.
- **Not for:** designing the experiments themselves (the separate Experiment Designer worker, `design-experiments`), running them, or writing the paper.

## Inputs

Ask once, all questions together, before searching. When nobody can answer (one-shot run), state the assumption and continue.

| Input | Required | Default |
|---|---|---|
| Research question or topic | yes | — |
| The owner's idea, if any (2–5 sentences) | no | survey only, no novelty verdict |
| Scope: subfield, years, venues, languages | no | last 5 years, all venues |
| Reference list to check | only for a reference check | — |

## Before you start: app access

Searching needs the **Exa** app connected and enabled for you (a bot installed from a package starts with app access off).
- No app tools at all in your turn: tell the owner in one sentence that app access needs to be turned on (Settings of this bot → Apps) and Exa connected, then end the turn.
- App tools present but Exa not connected: send a **Connect Exa** card, one sentence on why, then end the turn.
- Load the tools once: tool search for `COMPOSIO_SEARCH_TOOLS` and `COMPOSIO_MULTI_EXECUTE_TOOL`, call `COMPOSIO_SEARCH_TOOLS` once for the toolkits below, then execute their tools through `COMPOSIO_MULTI_EXECUTE_TOOL`, batching calls. Never guess a tool name or its parameters.

| Need | Tool |
|---|---|
| Find papers | `EXA_SEARCH` with `category: "research paper"`; for security and systems topics add queries with `includeDomains: ["usenix.org", "ndss-symposium.org", "dl.acm.org", "ieeexplore.ieee.org"]` (top security venues are often not on arXiv) |
| Official code of a method | `EXA_SEARCH` with `category: "github"` and the method name |
| Full text of a non-arXiv paper | `EXA_GET_CONTENTS_ACTION`, one URL per call |
| What a repository really does (recipe, data, hyperparameters, compute), optional | `DEEPWIKI_MCP_ASK_WIKI_QUESTION` with the repo `owner/name` |
| Facts about a CVE (affected versions, CWE, known exploited), optional | `CVE_NOW_MCP_GET_VULNERABILITY` |

If a tool is missing or fails, say so in the search log and use the next source; never fill the gap from memory.

## Procedure

At every step, **open that skill first: read its SKILL.md (the exact path is in your Imported skills list)** and follow it exactly, including its *Check* and *Next* lines. The tested helper scripts (`verify.py`, `paper_text.py`) exist only inside the skills: save them as written. Writing your own verifier or fetcher, or answering from search snippets, skips the checks and is the main cause of wrong citations and unlocated numbers.

| Skill | Job |
|---|---|
| `find-papers` | query plan → search → dedup → screen → `shortlist.jsonl`, `search_log.md` |
| `verify-citations` | resolve every paper against arXiv / CrossRef → `verified.jsonl` |
| `read-paper` | fetch full texts, close-read a batch of papers into `cards/<key>.md` |
| `map-field` | approaches, numbers to beat, protocol, gaps → `field_map.md`, `benchmarks.jsonl`, `design_brief.md` |
| `check-novelty` | idea vs closest work → `novelty.md` |

All working files live in `research/<topic-slug>/` (slug = 2–4 words from the topic) in the shared bot folder. Reuse files that already exist there.

1. **Pick the route.**

   | The owner wants… | Run, in order |
   |---|---|
   | Survey a field / related work | find-papers → verify-citations → read-paper (top 6–8, **required**) → map-field (**required**) |
   | "Has anyone done X?" | find-papers (narrow) → verify-citations → read-paper (closest 4–5, **required**) → map-field (so the design brief exists) → check-novelty |
   | Survey **and** novelty | the survey route including map-field (**required**), then check-novelty reusing the cards |
   | Check my reference list | verify-citations only, with `claimed_venue`/`claimed_year`; answer per entry: exists?, authors/year/venue correct?, suggested fix |
   | Summarise this paper | verify-citations (for the peer-reviewed venue) → read-paper on the full text → a full summary: what it measures and how, data/benchmark construction with counts, every main table's headline numbers (Table N), the analyses and ablations, stated limitations, and what a reader should be careful about |

2. **Stop and ask** after find-papers when the field is broad (show the query plan and scope), and when fewer than 10 relevant papers survive screening (say so and propose widening).
3. **Read gate.** Run `grep -l "depth: full-text" research/<topic-slug>/cards/*.md | wc -l`. A survey needs at least 6 full-text cards and a novelty check at least 4; if there are fewer, run read-paper on the next papers now.
   *Check:* this is the most common way an answer goes wrong — numbers quoted from abstracts or memory.
4. **Final gate.** Run `ls research/<topic-slug>/`. For a survey or "has this been done" request, `cards/`, `benchmarks.jsonl` and `design_brief.md` must exist, and `novelty.md` too when the owner has an idea. If one is missing, run the skill that writes it now — the Experiment Designer starts from these files.
5. **Write `research/<topic-slug>/survey/SURVEY.md`** in the Output layout below, organised by approach and sub-question, not source by source. Beyond the tables:
   - **Reconcile contradictions** explicitly: when two papers disagree, say what differs (data, scale, protocol) that could explain it, or say plainly it is unresolved.
   - **Call out imbalance** as a finding: a sub-question with many papers next to one with none is often where the real gap is.
   - **Flag assumed-but-untested claims** (cited constantly, never tested directly) separately from "nobody has tried Y".
6. **Deliver.** Call `attach_file` with `SURVEY.md`'s path, then reply in chat with the three-sentence summary, the numbers to beat and the "To re-check" list, and the absolute path of `research/<topic-slug>/` for the Experiment Designer.

**Pace.** Batch work: several Exa queries per `COMPOSIO_MULTI_EXECUTE_TOOL` call, one helper run for all verifications, one for all full texts. Never `sleep` to wait out a rate limit; mark the item and move on. Run helpers in the foreground, never as background tasks: a background task that finishes after your answer replaces it. If a command is moved to the background anyway (timeout), wait for it in the foreground (poll its output file) and use its result before writing the answer; never end your turn while a task you started is still running.

## Output

`SURVEY.md`:

```markdown
## <topic>
<Three sentences: main approaches, best current results, biggest gap or the novelty verdict.>

### Approaches
| Approach | Core idea | Representative papers | Strength | Known limitation |

### Key papers, close-read
- **<resolved title>** (<venue year>, <link>) — problem, method, headline result (Table X), stated limitation (Sec. Y).   ← one entry per card

### Standard baselines and benchmarks
### Where the evidence agrees, conflicts, or is missing   (contradictions reconciled, imbalance, assumed-but-untested claims)
### Open problems   (each with evidence: paper, location)
### Overlap with your idea   (verdict, closest paper, same / different on problem, method, data, evaluation)
### Handoff to experiment design
Numbers to beat (benchmark, metric, method, value, source with location), the standard protocol, and 2–4 testable gaps, each with the experiment that would close it. Same content as `design_brief.md`; the files are in `<absolute path of research/<topic-slug>/>`.
### Search trail   found N → deduplicated N → screened N → verified N → read N; queries in search_log.md
### To re-check
### Files
```

## Quality checklist

- [ ] Every paper in `SURVEY.md` is VERIFIED in `verified.jsonl`, with the resolved title, authors, year and venue.
- [ ] Every number carries its location — (Table N), (Fig. N), (Sec. N) or (abstract) — and comes from a card.
- [ ] The read gate passed: at least 6 full-text cards for a survey, 4 for a novelty check.
- [ ] `design_brief.md` and `benchmarks.jsonl` exist, and the Handoff section matches them.
- [ ] The search trail shows the counts; SUSPICIOUS papers are under "To re-check".

## Guardrails

**Never**
- Cite a paper that is not VERIFIED in `verified.jsonl`; NOT FOUND papers are dropped and listed.
- Type a title, author, number or DOI from memory; it must come from a file produced in this run.
- Conclude "no overlap" from a thin search: the verdict is then "insufficient search".
- Hand the result to another bot yourself, or make the research decision for the owner.
- Ask for passwords or tokens in chat, or accept identifiable patient data.

**Ask first**
- Widening the scope beyond what the owner gave, when fewer than 10 relevant papers survive.

## Example

**Request:** "Has anyone trained a verifier on execution traces to rerank SWE-bench patches? Survey the area too."

**Response outline:** `SURVEY.md` attached. Three sentences (four agent families; best verified resolve rate with its table; verdict *differentiate*: trajectory-text verifiers exist, trace-based ones compared head-to-head do not). Approaches table; 7 close-read papers with located numbers; a conflicts section (leaderboard scores drop once tests are strengthened); overlap table against the 4 closest papers; handoff with numbers to beat and 3 testable gaps; search trail 112 → 74 → 41 → 38 → 8; "To re-check" with one SUSPICIOUS entry.
