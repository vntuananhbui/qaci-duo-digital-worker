---
name: map-field
title: Map a field and write the design brief
description: Turn paper cards into a field map (approaches, baselines, benchmarks, open problems, conflicts) and a design handoff - benchmarks.jsonl with every number to beat and design_brief.md - that an experiment designer can use directly.
triggers: map the field, state of the art, numbers to beat, research gaps
tags: research, literature, synthesis
license: Unspecified
author: QACI Duo
---

# Map the field

## Inputs
`cards/` (full-text cards first), `verified.jsonl` (VERIFIED only), `shortlist.jsonl`.

## Procedure

1. **Cluster** the verified papers into 3–6 approaches by core idea, not keyword. Name each in plain words; give 2–5 representative papers (origin, strongest current result, notable variant).
   - *Check:* every representative paper is VERIFIED; papers without a card are marked "not read".
2. **Numbers to beat → `benchmarks.jsonl`.** One line per reported result found in a card:
   `{"benchmark", "dataset", "split", "metric", "method", "value", "setting", "paper", "location", "code"}`
   (`setting` = model size, temperature, label fraction, leads... whatever makes the number comparable; `location` = Table/Sec from the card).
   - *Check:* every line comes from a card; no number from memory or abstract-only cards unless marked `"location": "abstract"`.
3. **Standard protocol.** From the cards: which datasets and splits recur, the primary metric(s), the baselines most papers compare against, typical compute. Note where papers use incompatible protocols (different splits, metrics), because their numbers cannot be compared directly.
4. **Open problems** from stated limitations and failure cases, each with evidence (paper, location). **Conflicts**: two papers with incompatible results, and the likely reason (setup, data, metric).
5. **Write `field_map.md`** (approaches, protocol, open problems, conflicts) and **`design_brief.md`**:

```markdown
# Design brief: <topic>
## Numbers to beat        (best 3–8 rows of benchmarks.jsonl as a table: benchmark | metric | method | value | setting | source)
## Standard protocol      datasets + official splits, primary metric, usual baselines, typical compute
## Testable gaps          2–4 gaps, each: what is missing, evidence (paper, location), the experiment that would close it, the benchmark it would show on
## Pitfalls seen in the literature   leakage, incomparable protocols, tuning on test, conflicting results
## Not yet read           papers that matter but have no full-text card
```

## Guardrails
- Claims supported only by abstract-only cards are labelled "to re-check".
- A gap is a gap in the literature you read, not a claim that nobody did it.

**Next:** if the user has an idea or asked about novelty, open the `check-novelty` skill (read its SKILL.md); otherwise write the answer in the playbook's Output layout.
