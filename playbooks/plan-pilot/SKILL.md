---
name: plan-pilot
title: Plan a cheap pilot with go or no-go thresholds
description: Plan the cheapest runs (at most 10% of the budget) that de-risk the full study - baseline reproduction, pipeline sanity checks, a minimal signal test - each with numeric go/no-go thresholds and a fallback.
triggers: pilot study, de-risk the plan, go no-go, smoke test experiment
tags: research, experiments, pilot
license: Unspecified
author: QACI Duo
---

# Plan the pilot

## Inputs
`plan.md`, `hypotheses.md`.

## Procedure

1. **Reproduce the key baseline small** with its official script from `baselines_code.md`: the strongest baseline on a subset or a smaller model, with the expected number (scaled or from the card) and a tolerance. A failed reproduction stops the study until explained.
2. **Pipeline sanity checks**: overfit a tiny batch; shuffled labels give chance-level results; the evaluation script reproduces a published number from a released checkpoint when one exists; the split script asserts no leakage at the chosen unit.
3. **Minimal signal test**: the proposed method in one cheap setting against the baseline, enough seeds to see the minimum effect.
4. For each pilot run: cost in GPU-hours, **go / no-go threshold as a number**, and the decision on no-go (fix, pivot to the differentiated idea, or stop).
   - *Check:* the pilot costs at most 10% of the budget and finishes in the first week.
5. Write `pilot.md`.

**Next:** open the `review-design` skill (read its SKILL.md).
