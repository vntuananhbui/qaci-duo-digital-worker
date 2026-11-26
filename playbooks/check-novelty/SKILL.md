---
name: check-novelty
title: Check whether an idea has been done
description: Compare the user's idea with the closest verified prior work on problem, method, data and evaluation, and give a proceed, differentiate, already-done or insufficient-search verdict with the evidence.
triggers: has this been done, is my idea novel, novelty check, closest prior work
tags: research, novelty
license: Unspecified
author: QACI Duo
---

# Check novelty

## Inputs
The idea in 2–5 sentences (required); `verified.jsonl` and `cards/` if a survey already ran.

## Procedure

1. **Targeted search.** Write 3–5 queries that describe the idea itself (mechanism + task), plus the idea's paragraph as one descriptive `EXA_SEARCH` query (Exa matches meaning, so a full sentence works well). Run them through `find-papers` step 2–4 and `verify-citations`; append to the same files.
2. **Pick the closest 4–5** VERIFIED papers and run `read-paper` on them as one batch; the comparison below uses only their cards.
3. **Compare** on four axes — problem, method, data, evaluation — as a table: same / partly / different, with the location in the paper.
4. **Verdict:**
   - *already done*: a paper matches on problem and method.
   - *differentiate*: overlap on 2–3 axes; state the smallest change that makes the idea distinct, and the benchmark and baseline number (from `benchmarks.jsonl` or a card) it would have to beat.
   - *proceed*: no paper overlaps on both problem and method **and** the search was adequate.
   - *insufficient search*: fewer than 10 relevant papers screened, or the closest papers could not be read in full.
5. If `design_brief.md` exists, add the differentiated idea as the first entry under its *Testable gaps*.
6. Write `novelty.md`: verdict, closest paper, the table, the queries used, and what would change the verdict.

## Guardrails
- Never conclude "proceed" from a thin search.
- The verdict is a recommendation; the decision is the user's.

**Next:** write the answer in the playbook's Output layout.
