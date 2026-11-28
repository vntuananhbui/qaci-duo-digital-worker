---
name: form-hypotheses
title: Form falsifiable hypotheses
description: Turn an idea and the survey's testable gaps into 2-4 falsifiable hypotheses (main effect, mechanism, boundary), each with a measurable prediction against a sourced baseline number and a kill condition.
triggers: form hypotheses, falsifiable hypothesis, kill condition, prediction
tags: research, experiments, hypotheses
license: Unspecified
author: QACI Duo
---

# Form hypotheses

## Inputs
The question or idea (required); `design_brief.md`, `novelty.md`, `benchmarks.jsonl` and cards if they exist.

## Procedure

1. **Claim and mechanism.** One sentence for the claim; two for *why* it should work, citing the gap's evidence (paper, location). If novelty.md says "already done" or "differentiate", state the differentiated claim instead.
2. **Write 2–4 hypotheses:**
   - **H1 main effect**: the proposed method beats the strongest comparable baseline on the primary benchmark.
   - **H2 mechanism**: the specific component believed to cause the gain is what causes it (tested by an ablation).
   - **H3 boundary** (optional): where the gain should shrink or vanish (data scale, model size, domain shift), which makes the claim sharper.
   - **H4 cost / trade-off** (optional): what the method costs (compute, memory, latency, forgetting).
3. For each, write:
   - *Prediction*: metric on dataset/split, compared with <baseline> = <value> [source row or card], expected direction, **minimum effect worth reporting** with its justification (larger than the seed spread reported in the literature, or a stated practical threshold).
   - *Kill condition*: the result that would refute it.
   - *Experiment*: which experiment ID will test it (filled by build-experiment-plan).
   - *Check:* no hypothesis is vague ("improves performance"); each is decidable by one experiment within the budget.
4. Write `hypotheses.md`.

## Guardrails
- A baseline value you have not read in a card or benchmarks.jsonl is written "to obtain", never guessed.

**Next:** open the `build-experiment-plan` skill (read its SKILL.md).
