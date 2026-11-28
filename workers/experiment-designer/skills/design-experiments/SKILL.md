---
name: design-experiments
title: Design experiments from a literature survey
description: Turn a research idea and a survey's gaps into a reviewed experiment plan with falsifiable hypotheses, fair baselines with numbers to reproduce, ablations, fixed success and fail criteria, a pilot and a budget, as DESIGN.md plus a visual DESIGN.html.
triggers: design, experiment, experiments, design the experiments, design experiments, experiment design, plan experiments, experiment plan, plan baselines, design an ablation, turn my idea into a study, research plan, how should I test this idea, pilot study, compute budget for experiments
tags: research, experiment-design, planning
license: Unspecified
author: QACI Duo
---

# Design experiments from a literature survey

Runs a design request as a chain of skills that hand off through files in `research/<topic-slug>/`, so every hypothesis is testable, every baseline number comes from a paper that was read, and the plan has survived a reviewer's checklist before the owner sees it. The result is a plan a reviewer would accept and a student could start on in week 1, and that a separate Experiment Runner can follow without guessing.

## When to use

- Turn an idea or a survey's gaps into experiments; plan baselines, ablations, statistics, a pilot or a compute budget.
- **Not for:** surveying the field (the separate Literature Surveyor, `survey-literature`), running the experiments (Experiment Runner) or judging results (Experiment Validator).

## Inputs

Ask once, all questions together. When nobody can answer (one-shot run), state the assumption and continue.

| Input | Required | Default |
|---|---|---|
| Research question or idea | yes | — |
| `SURVEY.md`, or the path of its `research/<topic-slug>/` folder | no | run the reading skills for the 2–4 papers that define the baselines |
| Compute budget (GPU type and hours) | no | 1 GPU-class node, 200 GPU-hours, stated as an assumption |
| Data and models the owner can access | no | public datasets and open-weight models only |
| Deadline | no | none |

## Before you start: app access

Paper and code lookups need the **Exa** app (and optionally **DeepWiki**) connected and enabled for you.
- No app tools at all and no survey folder to work from: tell the owner in one sentence that app access needs to be turned on (Settings of this bot → Apps), then end the turn.
- Load the tools once: tool search for `COMPOSIO_SEARCH_TOOLS` and `COMPOSIO_MULTI_EXECUTE_TOOL`, call `COMPOSIO_SEARCH_TOOLS` once for the toolkits below, then execute their tools through `COMPOSIO_MULTI_EXECUTE_TOOL`, batching calls. Never guess a tool name or its parameters.

| Need | Tool |
|---|---|
| Find papers | `EXA_SEARCH` with `category: "research paper"`; for security and systems topics add queries with `includeDomains: ["usenix.org", "ndss-symposium.org", "dl.acm.org", "ieeexplore.ieee.org"]` |
| Official code of a method | `EXA_SEARCH` with `category: "github"` and the method name |
| Full text of a non-arXiv paper | `EXA_GET_CONTENTS_ACTION`, one URL per call |
| What a repository really does (recipe, data, hyperparameters, eval script, compute), optional | `DEEPWIKI_MCP_ASK_WIKI_QUESTION` with the repo `owner/name` |
| Facts about a CVE, optional | `CVE_NOW_MCP_GET_VULNERABILITY` |

If a tool is missing or fails, say so and use the next source; never fill the gap from memory.

## Procedure

At every step, **open that skill first: read its SKILL.md (the exact path is in your Imported skills list)** and follow it exactly, including its *Check* and *Next* lines.

| Skill | Job |
|---|---|
| `form-hypotheses` | idea + gaps → 2–4 falsifiable hypotheses with predictions and kill conditions → `hypotheses.md` |
| `build-experiment-plan` | protocol, baselines, experiment matrix, ablations, statistics, budget → `plan.md`, `plan.yaml` |
| `plan-pilot` | the cheapest runs that de-risk the plan, with go / no-go thresholds → `pilot.md` |
| `review-design` | skeptical-reviewer checklist, fixes applied → `review.md` |
| `check-baseline-code` | official repos of the 2–3 key baselines: recipe, data, hyperparameters, eval script, compute → `baselines_code.md` |
| `find-papers`, `verify-citations`, `read-paper` | fill a missing baseline number or protocol detail from a paper read in full |

1. **Read the survey handoff.** Read `SURVEY.md` in full, then, when they exist next to it, `design_brief.md`, `benchmarks.jsonl`, `novelty.md`, `field_map.md` and the cards of the baselines you will use. List what you took from them.
   - No survey, or a baseline you need has no card: run find-papers → verify-citations → read-paper for the 2–4 papers that define the baselines and protocol. Do not design against numbers you have not read.
   *Check:* every experiment you are about to design targets a specific gap or claim from the survey, not a restatement of the question.
2. **Design:** check-baseline-code → form-hypotheses → build-experiment-plan → plan-pilot → review-design.
3. **Apply the review's blocking and major fixes** to `plan.md`.
4. **Complete each experiment for the Runner and Validator.** For every row of the experiment matrix, `DESIGN.md` must name:
   - **Variables**: independent (the one thing changed), dependent (the one thing measured), controlled (data split, seed list, hardware, tuning budget — named, not "everything else").
   - **Success criterion and fail criterion**, both as numbers fixed now, plus what an inconclusive result looks like.
   - **Prerequisites**: data, credentials, paid APIs, and any data licence the owner must confirm.
   - **Known risks**: each tied to the exact number or decision it could distort, never a generic "results may be noisy".
   - **Order and reuse**: when an experiment reuses another's output, split or corpus, name the exact artifact in both sections.
   - **Runtime ballpark** with the GPU-hour arithmetic.
5. **Write `research/<topic-slug>/design/DESIGN.md`** in the Output layout below, and **`research/<topic-slug>/design/DESIGN.html`** with the same content as a visual report: an inline-SVG diagram of experiment order and dependencies, each experiment as a styled card (variables and control vs. treatment side by side), success and fail criteria as visible PASS / FAIL badges, the budget as a small table. Inline `<style>` and `<svg>` only — no external assets, no scripts; it must open offline.
6. **Deliver.** Call `attach_file` with `DESIGN.md`'s path (never `DESIGN.html`'s: `attach_file` refuses .html) and mention the absolute path of `DESIGN.html`. Reply in chat with the three-sentence summary, which experiments must run in order, the prerequisites the owner must arrange, and the decisions that remain theirs.

**Stop and ask** when the budget cannot fit even the "must" experiments (show the cut options), and when the survey says the idea is already done (propose the differentiated version and ask which to design).

**Pace.** Run helpers in the foreground, never as background tasks: a background task that finishes after your answer replaces it. If a command is moved to the background anyway (timeout), wait for it in the foreground (poll its output file) and use its result before writing the answer; never end your turn while a task you started is still running.

## Output

`DESIGN.md`:

```markdown
## <study title>
<Three sentences: what is tested, against what, and what result would change the owner's mind.>

### What I used from the survey      (files and the key numbers to beat, with sources)
### Hypotheses
| ID | Claim | Prediction (metric, data, vs baseline = value [source], min effect) | Kill condition |
### Protocol                         datasets and splits (unit of leakage check), primary / secondary metric, sealed test, tuning budget
### Baselines
| Baseline | Why | Number to reproduce [source] | Our setting |
### Experiment matrix
| ID | Tests | Conditions | Held fixed | Metric | Seeds | GPU-h |
### Experiments                      one section per ID: variables, method, prerequisites, PASS / FAIL / inconclusive criteria, known risks, reuse, runtime
### Ablations                        (one change each, tied to the mechanism hypothesis)
### Statistics and decision rules
### Pilot (first ≤10% of budget)     runs, go / no-go thresholds, what to do on no-go
### Compute budget                   total vs available; must / should / could
### Reviewer objections and how the plan answers them
### Decisions for you
### Files
```

## Quality checklist

- [ ] Every baseline number, split and protocol detail cites a `benchmarks.jsonl` row or a card (paper, Table/Sec).
- [ ] Every hypothesis has a prediction and a kill condition; every experiment has PASS and FAIL criteria as numbers.
- [ ] The test set is sealed; baselines get the same data, compute and tuning trials as the proposed method.
- [ ] Seeds and the statistical test are fixed before running, sized to the expected effect versus seed noise.
- [ ] The must-tier fits the budget, with the GPU-hour arithmetic shown.
- [ ] `DESIGN.md` is attached and `DESIGN.html` exists with the same experiments.

## Guardrails

**Never**
- Type a number from memory: if it is needed and not read, write "to obtain (paper)" or read it now.
- Cite a paper found during design before it passes verify-citations; list it under "To re-check" instead.
- Invent or soften a success or fail criterion after a result exists; revise the document visibly instead.
- Design around a metric that real execution could not produce, or omit a prerequisite the Runner will need.
- Train or launch anything, or hand the design to another bot yourself.
- Ask for passwords or tokens in chat, or accept identifiable patient data.

**Ask first**
- Cutting a "must" experiment to fit the budget; switching to a differentiated idea.

## Example

**Request:** "Here is SURVEY.md on SWE-bench verifiers. Design experiments for a verifier trained on execution traces. Budget: 4×A100 for two weeks."

**Response outline:** `DESIGN.md` attached, `DESIGN.html` path given. Three sentences (trace verifier vs. trajectory-text verifier and test voting on SWE-bench Verified; numbers to reproduce from the survey's cards; what result would kill the idea). Three hypotheses with predictions and kill conditions; baselines with numbers to reproduce and their sources; a 9-row matrix with GPU-hours; per-experiment PASS / FAIL badges; a pilot on 50 instances with go / no-go thresholds; budget 610 of 1,344 GPU-hours (must tier); reviewer objections answered; decisions for the owner.
