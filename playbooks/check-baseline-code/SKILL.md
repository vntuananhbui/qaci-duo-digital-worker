---
name: check-baseline-code
title: Check what baseline repositories really do
description: For the 2-3 baselines the plan will reproduce, find the official repository and read what it actually does (training recipe, data, hyperparameters, evaluation script, reported compute) so the plan can reproduce them faithfully and estimate GPU-hours from evidence.
triggers: check baseline code, official repo, training recipe, reproduce baseline
tags: research, baselines, reproducibility
license: Unspecified
author: QACI Duo
compatibility: DeepWiki and Exa app connections
---

# Check baseline code

## Inputs
The baselines you intend to reproduce (from `design_brief.md`, `benchmarks.jsonl`, `novelty.md`); their cards (field *Code / data release*).

## Procedure

1. **Find the official repo** for each baseline: the card's code link; otherwise `EXA_SEARCH` with `category: "github"` and the method name, and keep only a repo the paper or its authors link to (else mark it "unofficial").
2. **Ask DeepWiki** (`DEEPWIKI_MCP_ASK_WIKI_QUESTION`, repo `owner/name`), batching the repos in one `COMPOSIO_MULTI_EXECUTE_TOOL` call, these questions:
   - Which script and config reproduce the paper's main result, and with which datasets and splits?
   - Key hyperparameters (learning rate, batch size, steps or epochs, model size) and their defaults.
   - Which script computes the evaluation metric, and does it match the paper's metric?
   - Hardware and training time stated in the README or docs.
3. **Write `baselines_code.md`**: one block per baseline with repo, commit or release if given, the answers, and for each answer whether it came from code/README (DeepWiki cites files) or is unclear.
   - *Check:* every compute figure you will use for GPU-hour estimates is either from a card (paper, Sec.) or from this file (repo, file); otherwise it is an assumption and labelled so.
4. Note mismatches between paper and code (different metric script, extra data, undocumented tricks): they are reproduction risks for the pilot.

## Guardrails
- DeepWiki answers summarise the repo; quote file names they cite, and treat anything without a file as "to verify in code".
- No repo found: say so; the plan budgets a reimplementation and a wider reproduction tolerance.

**Next:** open the `form-hypotheses` skill (read its SKILL.md).
