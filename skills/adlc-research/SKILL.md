---
name: adlc-research
title: "Process: research"
description: "Research process run by one agent: research brief, fair measurement plan, spike branches, comparison with real numbers, and an evidence-backed recommendation committed to reports/."
triggers: "adlc research, research, compare options, evaluate alternatives, spike, which approach is better, quy trình: nghiên cứu, nghiên cứu"
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Process: research

The result of research is **an evidence-backed recommendation**, not a feature. **Never merge experimental code into the base branch.** You run every phase yourself: Specify → Plan → Implement → Verify → Merge (report and measurement scripts only) → Report. Subagents (Task/Agent) may run independent directions in parallel; you keep the measurement plan and the comparison.

Git and the **base branch** come from the assignment; spike branches and commits follow `adlc-git-local`.

Used with: `adlc-approval`, `adlc-git-local`, `adlc-report`.

## When to use

- `adlc-triage` classified the work as **research**: a question whose answer decides what to build (which library, model, architecture, approach).

**Not for:** shipping the chosen option (`adlc-feature`, usually the follow-up), reproducing a paper as a prototype (`adlc-paper-prototype`), fixing defects (`adlc-bugfix`).

## Inputs

| Input | Required | Default |
|---|---|---|
| The question, in one sentence | Yes | — |
| Why it matters: which decision depends on it | Yes | — |
| Known options | No | You propose options |
| Comparison criteria (accuracy, speed, cost, complexity, offline constraint, …) with weights | Yes | Ask; weights equal if not given |
| Constraints and time limit | No | Ask for a time limit |
| Repository and base branch | Yes | From the assignment |

## Procedure

### Specify

1. Open the progress log (`adlc-report`). **Write the research brief** (the SPEC for this work):
   - the question, one sentence;
   - why it matters and which decision depends on it;
   - known options and **comparison criteria**, weighted if possible;
   - constraints and time limit;
   - acceptance criteria: every option has numbers for every criterion; a recommendation with reasons; the risks of the recommendation;
   - `done_when`: "comparison and recommendation committed in reports/, with numbers".
2. Send the brief to the owner, then pass the **SPEC approval** point (`adlc-approval`).

### Plan

3. Add options not yet listed if they are worth trying.
4. **Research plan**: one direction per option, how each criterion is measured, and **the same test dataset and the same measurement method** for every option, for a fair comparison. Each direction gets a branch `spike/<task>-<direction>`. Pass the **Plan approval** point (`adlc-approval`).
   *Check:* the dataset and the measurement command are identical across directions.

### Implement

5. Per direction, on its spike branch: experimental code may be simple, but **the measurement script must be rerunnable**, with its run command written down.
6. Measure exactly the planned criteria on the shared dataset. Never tune an option to fit the measurement set.
7. Record per direction: numbers, method, pros/cons, surprises.

### Verify

8. Review the results: are the numbers reproducible (rerun the script yourself), and were all options compared under the same conditions? Fill any gap before writing the report.

### Merge

9. Write `reports/research-<task>.md`: the question, a comparison table of options × criteria (real numbers), the recommendation and reasons, risks, and the next step if the recommendation is chosen (usually a feature task). Commit it to the base branch per `adlc-git-local`, passing the **Merge approval** point; **commit only the report and the measurement scripts**, never the experimental code.

### Report

10. **Reopen `adlc-report`** and send the full Completion report. Acceptance uses the brief's criteria; the Quality section is the summarized comparison table. Add a section **Decisions the owner needs to make**.

## Output

`reports/research-<task>.md`:

```
# Research: <question>
## Why it matters
## Options and criteria (weights)
## Method (dataset, measurement command per option)
## Comparison
| Option | <criterion 1> | <criterion 2> | ... | Weighted score |
## Recommendation and reasons
## Risks
## Next step (proposed task)
```

## Quality checklist

- [ ] Every option has a real number for every criterion, with its source command.
- [ ] Same dataset and measurement method for all options.
- [ ] Measurement scripts rerun by you; results match.
- [ ] Only the report and measurement scripts reached the base branch.
- [ ] Completion report includes "Decisions the owner needs to make".

## Guardrails

**Never**
- Merge experimental code into the base branch.
- Report a number not produced by a recorded run.
- Tune an option to the measurement set.

**Ask first**
- Exceeding the agreed time limit.
- Spending money (paid APIs, cloud resources) to measure an option.

## Example

**Request:** "Should we use FAISS or pgvector for product search?"

**Outline of the response:** brief with criteria recall@10, p95 latency, ops cost, offline support; plan with one shared 50k-item dataset and one benchmark script; spikes `spike/vector-faiss` and `spike/vector-pgvector`; results rerun and compared; `reports/research-vector-search.md` committed with the table and recommendation; Completion report with the decision the owner must make.
