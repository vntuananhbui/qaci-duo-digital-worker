---
name: build-experiment-plan
title: Build the experiment plan
description: Design the protocol, fair baselines with numbers to reproduce, an experiment matrix with GPU-hour estimates, single-change ablations, pre-registered statistics and decision rules, and a budget with must/should/could priorities.
triggers: experiment matrix, baselines and ablations, statistics plan, compute budget
tags: research, experiments, planning
license: Unspecified
author: QACI Duo
---

# Build the experiment plan

## Inputs
`hypotheses.md`; `design_brief.md`, `benchmarks.jsonl`, cards; the user's budget and data access.

## Procedure

1. **Protocol.**
   - Datasets and **official splits** from the brief; if a dataset has no standard split, define one and save the IDs.
   - The **unit of leakage** (patient, user, task, prompt source, time) and how the split respects it.
   - One **primary metric** (the one the hypotheses are judged on) and up to three secondary metrics.
   - **Sealed test**: selection, early stopping and tuning on validation only.
   - *Check:* the protocol matches the one behind the literature numbers you will compare with; if it cannot, say the numbers are not comparable and plan to rerun the baseline.
2. **Baselines**, each with a reason:
   - (a) a simple lower bound;
   - (b) the strongest comparable published method from `benchmarks.jsonl`, with its **number to reproduce in its own setting first** and a tolerance (for example within 1 point or within its reported std);
   - (c) the closest prior work from `novelty.md`;
   - (d) an upper bound or oracle when meaningful (joint training, replay, full fine-tuning).
   - **Fairness**: same data, same training compute, same number of tuning trials per method (state it); report parameters and FLOPs or latency.
2b. For each reproduced baseline, use `baselines_code.md`: official script and config, known paper/code mismatches, and its reported compute.
3. **Experiment matrix**, one row per experiment: ID, hypothesis tested, conditions, what is held fixed, metric, seeds, GPU-hours. Estimate GPU-hours from the compute reported in the cards or by scaling (tokens × steps / throughput); **show the arithmetic**.
4. **Ablations**: remove or replace one component at a time, each tied to H2; include a control that matches the extra compute or parameters of the proposed component.
5. **Statistics and decision rules**: seeds per configuration (≥3; ≥5 when the minimum effect is under twice the seed spread), what is reported (mean ± std or 95% CI), the test (paired across seeds or tasks: paired bootstrap, Wilcoxon, or t-test), correction when making more than three comparisons, and for each hypothesis the rule "supported if … / refuted if …".
6. **Budget**: total GPU-hours against the user's budget, each experiment tagged must / should / could, and what is cut first.
7. Write `plan.md` (sections above) and `plan.yaml` with keys `objectives, datasets, baselines, proposed_methods, ablations, metrics, statistics, risks, compute_budget`.
   - *Check:* every baseline number has a source; the must-tier fits the budget; every hypothesis has an experiment ID.

**Next:** open the `plan-pilot` skill (read its SKILL.md).
