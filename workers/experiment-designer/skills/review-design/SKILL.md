---
name: review-design
title: Review an experiment design like a skeptical reviewer
description: Review the plan as a skeptical top-venue reviewer against a fixed checklist (leakage, test-set use, baseline strength and fairness, confounds, missing ablations, power, comparability, feasibility, overclaiming) and apply the blocking and major fixes.
triggers: review my experiment design, reviewer objections, check the plan
tags: research, experiments, review
license: Unspecified
author: QACI Duo
---

# Review the design

## Inputs
`plan.md`, `pilot.md`, `hypotheses.md`.

## Procedure

1. Read the plan as a reviewer who wants to reject it. For each item, write *finding — severity (blocking / major / minor) — fix*:
   - **Leakage**: split unit, duplicates, pretraining data overlapping test sets.
   - **Test-set use**: any selection, early stopping or prompt tuning on test.
   - **Baselines**: weak, outdated, untuned, not reproduced, or tuned less than the proposed method.
   - **Confounds**: more parameters, compute, data or training steps for the proposed method; different backbones.
   - **Ablations**: the claimed mechanism has no ablation, or ablations change two things at once.
   - **Power**: seeds too few for the minimum effect; no statistical test; many comparisons without correction.
   - **Comparability**: numbers compared across incompatible protocols.
   - **Generality**: one dataset or one model size only.
   - **Feasibility**: GPU-hour estimates without arithmetic, or the must-tier exceeds the budget.
   - **Overclaiming**: conclusions the design cannot support.
2. Apply every blocking and major fix to `plan.md` (and `pilot.md` if needed); list minor ones.
   - *Check:* no blocking finding remains open.
3. Write `review.md`: the findings table and what changed.

**Next:** write the answer in the playbook's Output layout.
