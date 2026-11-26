---
name: adlc-paper-prototype
title: "Process: paper to prototype"
description: Turn a research paper into an end-to-end prototype (trained model, step-by-step demo app, evaluation page) compared honestly against the paper, never inventing numbers. For paper-prototype work.
triggers: "adlc paper prototype, paper to prototype, reproduce this paper, build a prototype from a paper, implement this paper, quy trình paper → prototype, tái hiện paper"
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Process: paper to prototype

The goal is **one product prototype that runs end to end**, implementing the paper's core method faithfully at small (CPU) scale:

- **Full pipeline**: data → train → **saved model** → **predict function/API** that takes a new input and returns a result.
- **Demo app** that runs locally with one command: the user picks or uploads an input (or generates one in the app, e.g. sets a noise level), clicks run, and sees **the prediction, its confidence, and a visual of each step of the method** (intermediate features, each branch's output, how branches are combined), not just a line of text.
- **Evaluation page** compared with the paper: numbers, "Reproduced" vs "Paper" charts, and an honest conclusion.

Full SOTA results are not required; missing any of the three parts means no prototype.

You run every phase yourself: Specify → Plan → Implement → Verify → Merge → Report. A subagent may implement parts; it never approves anything. Use with: `adlc-approval` (cards), `adlc-git-local` (branch `paper/<task>`; base branch from the assignment), `adlc-code-review`, `adlc-verify-browser`, `adlc-ui-preview`, `adlc-report` (progress log and Completion report), and the **QACI Data** MCP tools (`qaci_data_list_papers`, `qaci_data_get_paper`) when the owner has connected it. All plan files live in `sharedBotFolder/plans/<repo>-<task>/`.

## When to use

- `adlc-triage` classified the work as paper-prototype: the owner sends a paper (arXiv, URL, PDF, or QACI Data) and wants a working prototype of its method.

**Not for:** a literature survey or comparison without a prototype (`adlc-research`); a normal product feature (`adlc-feature`); fixing an existing prototype bug (`adlc-bugfix`); publishing or deploying afterwards (`deploy-github`, `deploy-azure-devops`, `deploy-render`).

## Inputs

| Input | Required | Default |
|---|---|---|
| Paper source: arXiv/URL, attached PDF, or QACI Data | yes | ask the owner; never guess a paper |
| Repository and base branch | yes | from the assignment |
| Time budget for `reproduce.sh` | no | 10 minutes wall-clock |
| Integration target | no | standalone repo (not an existing app) |
| `Approval points:` line | no | auto (but the plan card is always sent) |

## Hard rules

1. **Never invent numbers.** Every "Reproduced" number in the report, README and evaluation page is **read from `results/metrics.json`** written by `eval.py`, and the report cites its key, e.g. `metrics.json:fusion.overall`. A number not in the file is written "not run" with the reason. Never copy from logs or memory; never estimate.
2. **Every "Paper" number names its method and its table/section** in the paper. Papers have many baselines; never attribute one baseline's number to another.
3. **Every experiment setting has a source**: `paper` (with table/section), `inferred` (with the reason), or `unknown`. Never silently add conditions the paper does not have.
4. **Time budget**: `reproduce.sh` with defaults finishes in **at most 10 minutes wall-clock** (not total CPU; multiple cores are fine) unless the owner agrees otherwise. Any long command always has a time limit (e.g. `perl -e 'alarm shift; exec @ARGV' 900 ./reproduce.sh`); on timeout, stop and report; never raise the limit yourself.
5. **Match thresholds are fixed in the plan, before running, and test the paper's actual claim.** Never loosen them after seeing results. If the paper states a number or shape ("slope about −4", "3 points above baseline", "recovers the exact formula"), the threshold measures exactly that quantity. An easier criterion ("beats baseline" instead of "slope −4") is only a **proxy check**: label it as a proxy, and the verdict for that claim is at most "Partial match".
6. **Evidence is real**: app screenshots come from a browser showing the running app, not redrawn from data; numbers come from the result file of the exact run cited.
7. **The plan is always approved by the owner through the Plan approval card**, whatever the `Approval points:` line says and however small the task. Never self-approve it, never use `NEEDS INPUT:` for it, never start implementing before the owner answers.
8. **Flag-off parity**: when the method is added into an existing app or pipeline, put it behind a flag defaulting to off, and prove with a test that flag-off behavior is identical to the base branch (same outputs on fixed inputs, `baseline-tests.txt` still passes).

## Papers that need a GPU or large infrastructure

The demo app and the end-to-end flow (input → `predict` → result and per-step visuals) **always run for real on the owner's machine**. For the heavy part, choose the **lowest level that is still honest**:

| Level | When | Heavy part | App label |
|---|---|---|---|
| **A. Real run, small scale** | Training and prediction both fit on CPU within budget | As in this procedure | "Real model" |
| **B. Published weights** | Training needs a GPU but authors/community publish a checkpoint and prediction runs on CPU (maybe small or quantized) | No retraining; download the checkpoint (record source and license); `predict` runs for real on CPU; evaluate on a small subset | "Real model, weights from <source>" |
| **C. Scaled-down model** | No usable checkpoint, or prediction is also too heavy | Implement **the paper's exact algorithm** in a tiny configuration (few layers/parameters, small data), trained on CPU so every step still runs and can be visualized | "Scaled-down version, not the paper's model" |
| **D. Replay published outputs** | Even a scaled-down version is meaningless (cluster, private data, closed system) | Use input/output examples **the authors published** (paper, project page, repo); the app replays exactly those, inventing nothing | "Replaying the authors' examples, no model run" |

- B, C and D create no "Reproduced" numbers for what was not run: `metrics.json` holds only real measurements (e.g. of the scaled-down model, labeled as such); the verdict for the rest is "Not reproduced: needs <GPU/infrastructure>".
- The level label is shown **in the app** next to the result, not only in the README.
- Code can still run the full version given the hardware: `config.yaml` has a "paper" config beside the "demo" config, `train.py` uses a GPU if present. The README states the required hardware and estimated time/cost for the full run.
- Renting a GPU, calling a paid API or using an external service always needs the owner's card (it spends money), even while self-approving.
- **Choose the level from the real hardware where you run**, not any other machine. Before proposing, check and record in the contract: OS, CPU cores, RAM, whether a GPU really exists (`nvidia-smi`; PyTorch: `torch.cuda.is_available()`, `torch.backends.mps.is_available()`). No GPU means "training needs a GPU" leads to B, C or D, not A.
- **The prototype runs on CPU on any machine the owner uses.** Device selection is automatic CUDA → MPS → CPU, never hard-coded. A GPU only speeds things up: `reproduce.sh` with defaults and the demo app (including prediction) finish on CPU within budget. Any result obtainable only with a specific machine's GPU is noted under "Differences from paper" as not reproducible on CPU-only machines.
- **The demo app never waits on heavy work.** Any step over 5 seconds on CPU (e.g. multi-step sampling) uses results precomputed into `artifacts/` by `reproduce.sh`, labeled "precomputed"; only light parts are computed live.

## Procedure

### Specify

1. **Get the paper** from exactly one source: an arXiv link/URL the owner sent; an attached PDF; or `qaci_data_list_papers` / `qaci_data_get_paper`, **only if the owner connected QACI Data** (several results: ask the owner to pick before reading on). No clear source: ask; never guess or invent a paper. Open the progress log (`adlc-report`).
2. **Read the full text** (arXiv: `arxiv.org/html/<id>` or the PDF), not just the abstract. If only the abstract is available, record "abstract only" and ask the owner before continuing.
3. **Write the paper contract** at `plans/<repo>-<task>/CONTRACT.md`. Each item has an ID, content and source (paper table/section/figure):
   - **Problem**: what the paper solves and why (a few sentences, no ID).
   - `K1…` **main claims to test**: 1–3 core statements (e.g. "A beats B under condition X"), not just one overall number.
   - `D1…` **data**: dataset name and source, public or not, size, number of classes, data conditions (noise, distortion, preprocessing).
   - `S1…` **train/val/test split**.
   - `M1…` **method**: steps in order, key formulas in plain words, model size.
   - `T1…` **training**: optimizer, learning rate, epochs, batch, number of seeds.
   - `E1…` **metrics and paper results**: table "method | metric | number | table/section"; copy grouped results too (e.g. per noise level).
   - `U1…` **demo app user flows**: who uses it, what input, what output, and which method steps the user must **see** to understand it.
   - `V1…` **figures for the evaluation page**: method diagram, key paper figures/tables to redraw for comparison.
   - **Feasibility and proposed level**: hardware needed to train and to predict, public checkpoint or not, the measured hardware where you run; propose **level A/B/C/D** with reasons; out-of-scope items and why.
4. **Verify the contract against the full paper** before planning: each `E` number belongs to the right method and table; each `D/S/M/T` item has the right source. Fix what is wrong.
   *Check:* every contract item has a source.
5. Send the contract to the owner, then request **SPEC approval** (point `spec`, `adlc-approval`; self-approval only if the `Approval points:` line allows, logged as "Self-approved: spec — <reason> — <evidence>"). The level is approved together with the contract. Record `done_when`: "prototype merged; on a clean clone `reproduce.sh` passes within budget and produces the model, `results/metrics.json`, `report/index.html`; `run_demo.sh` opens the app and runs every `U` flow; the report checks every K/E item".

### Plan

6. Write `plans/<repo>-<task>/PLAN.md`:
   - **Data**, in priority order: (1) **the paper's own dataset** when public and downloadable (under ~1 GB, license allows research use), using a subset with the paper's split; if it needs accepting terms or a login, ask the owner. (2) Only if that is impossible, **synthesize data** mimicking exactly the conditions in `D`; **add no noise, distortion or difficulty the paper lacks** (if the paper has a robustness experiment with that distortion, it shows how much it costs). State why the paper's dataset could not be used.
   - **`config.yaml`**: every experiment setting with a source comment per hard rule 3, e.g. `epochs: 12  # paper §III-C`, `snr_step: 2  # inferred: paper gives only a range`. Code reads settings from it, never hard-codes them.
   - **"Differences from paper" table**: every deviation from the contract (data, classes, set size, model, training, seeds) and its expected effect.
   - **Match thresholds** (hard rule 5), one row per `K`/`E` item: "paper claim (exact sentence or number, with section/figure)" | "quantity measured" | "Match threshold" | "Partial match threshold" | "direct or proxy check". If the paper only has a figure, read the value off it (say which figure) and threshold that quantity.
   - **Prototype architecture**: modules (data, model, train, `predict`, demo app); app technology (one-command local, no network at runtime: FastAPI/Flask serving HTML, or Gradio/Streamlit if installable); what the app shows for each `U`. If integrating into an existing app: the flag name and the flag-off parity test (hard rule 8).
   - **Build order**, each step with its own quick check command: data (print samples, per-class stats, compare with `D`) → **simplest working baseline** → the paper's method → `metrics.py` → `train.py` saves the model → `predict` → `eval.py` → `make_report.py` → demo app → `reproduce.sh`, `run_demo.sh`.
   - **Budgets**: `reproduce.sh` per hard rule 4; the app starts in under 30 s and returns one input's result in under 2 s on CPU. If one run takes under 2 minutes, run **at least 3 seeds**.
   - **Deliverables**: `config.yaml`, `metrics.py` with its own tests, `train.py` saving to `artifacts/`, a `predict` module (one input → label, confidence, intermediate values to plot), `eval.py` writing `results/metrics.json`, `make_report.py` producing `report/index.html`, the demo app, `reproduce.sh`, `run_demo.sh`, end-to-end tests for `predict` and the app API, `README.md`, `requirements.txt`, `.gitignore` (`__pycache__/`, `.pytest_cache/`, `.venv/`, `artifacts/`, downloaded data folders), branch `paper/<task>`.
7. **Plan approval card — always, to the owner** (hard rule 7): send the plan in the message right before the card; the card summarizes the dataset, the "Differences from paper" table, the match thresholds and the budget. This is where the owner catches setup drift before code. Wait for the answer.

### Implement

8. Before coding, read any official public code the paper relies on. If a formula or step is unclear, resolve it from the paper or ask the owner; do not guess silently.
9. Code in **Python** in the plan's order; after each step run its check command before moving on. A working baseline comes before the paper's method.
10. **`metrics.py`** holds all metric computation, tested against hand-computed values. After plan approval, change `metrics.py`, thresholds, budgets or time limits only with the owner's agreement.
11. **Measure before running big**: run a tiny config (a few % of data, 1 epoch), time it, extrapolate the default config. Over budget: shrink the config and record it. Long commands always have a time limit.
12. **`eval.py`** writes `results/metrics.json`: numbers per method, per condition group the paper uses, per seed plus mean ± std, plus the `config` used and run time. Write to a temp file and rename on success; a failed run leaves no old or partial `metrics.json`.
13. **`make_report.py`** produces **`report/index.html`** and saves each figure as **a separate image file in `report/`** (PNG/SVG, each under ~100 KB), referenced by relative `<img src="...">`: **no base64 images in the HTML**, so each file fits one tool call when pushed to GitHub through the connected app. No CDN; page and images open offline. Every number on the page is read from `results/metrics.json`. Sections in order:
    - **What the paper does**: 2–3 sentences and a **method diagram** (blocks and data flow, matplotlib or SVG).
    - **What the data looks like**: a few visual input samples per class or condition.
    - **Main results**: one chart per `K`, "Reproduced" line/bar beside the "Paper" point; redraw each `V` figure.
    - **Error analysis**: one figure showing where the model fails (e.g. confusion matrix).
    - **Number table** from `metrics.json`, the **"Differences from paper"** table, and the Match / Partial match / Not reproduced verdict per threshold.
14. **`train.py`** saves the model and everything prediction needs (normalization parameters, class list) into `artifacts/`. **`predict`** loads exactly those files, takes one input, returns label, confidence and intermediate values for the app.
15. **Demo app** (technology per plan), started by `run_demo.sh`, prints the local address when ready; without a model it says to run `reproduce.sh` first. For each `U`: pick, upload or generate input in the app; show the input visually; show **each step of the method** as figures (intermediate features, per-branch probabilities, the combination); show the final result and confidence; show the level label. Add a short "What this paper does" section and a link to the evaluation page.
    - **Opening the app shows a finished example**; never an empty page waiting for a click.
    - **Every `U` flow opens from a parameterized URL** (e.g. `/?input=…&mode=…`) that renders that state, so each flow can be screenshotted without clicking; the README lists these URLs.
    - **Present results the way the paper does**: formulas simplified to readable form (merged constants, sensible rounding, raw form if needed), units and scales (e.g. log-log) as in the paper's figures, readable class names instead of indices. Follow `adlc-ui-preview` for UI changes.
16. **`reproduce.sh`**: one command for data → `train.py` → `eval.py` → `make_report.py` with defaults, within budget, non-zero exit on error. **The repo stands alone on another machine**: `reproduce.sh` and `run_demo.sh` reference no path outside the repo (no bot venv or work folder); Python comes from an environment variable if set, else `.venv/` in the repo, else `python3`; `requirements.txt` lists every package.
17. **End-to-end tests**: `predict` on a few sample inputs with the saved model; the app API returns the right structure (start the app in the test, call it, stop it); flag-off parity test when integrating (hard rule 8).
18. Run `reproduce.sh` and `run_demo.sh` yourself, use the app, record the **real output**. Commit, tests green, then request **Push approval** (point `push`, `adlc-approval`) and open the PR (work branch) with `adlc-git-local`.
19. If the same bug survives 3 fix attempts, stop and record what fails, what was tried, and the suspected cause; tell the owner.

### Verify

20. **Review** with `adlc-code-review` (skip items not applicable to small experimental code), plus:
    - mark each contract item `D/S/M/T/E`: **as paper / deviates (listed in "Differences from paper") / dropped**; a deviation not listed there is a defect;
    - `metrics.py` is separate and tested against hand-computed values;
    - `config.yaml` sources every line and the code really reads it;
    - the evaluation page has every `V` figure and every number on it comes from `metrics.json`;
    - the app covers every `U` flow, and `predict` uses exactly the model saved by `train.py` (no retraining, no other model);
    - every deliverable in the plan exists. Fix whatever is missing before continuing.

### Merge

21. Request **Merge approval** (point `merge`, `adlc-approval`); on approval (or logged self-approval), merge with `adlc-git-local`.

### Verify on a clean clone

22. After the merge: `git clone <repo> <new temp dir>`, run `reproduce.sh` with a time limit, save the full output to `plans/<repo>-<task>/reproduce.log`.
23. **Use it like a user** with `adlc-verify-browser`:
    - run `run_demo.sh` and **open the app in a real browser** (calling the API alone is not enough). If the browser refuses local addresses or there is no browser tool, screenshot with headless Chrome from the shell: `perl -e 'alarm shift; exec @ARGV' 120 "<Chrome>" --headless=new --no-first-run --disable-gpu --use-mock-keychain --password-store=basic --user-data-dir=<new temp dir> --window-size=1400,1800 --virtual-time-budget=8000 --screenshot=<file>.png "<flow URL>"`, then delete the temp dir. Without the two keychain flags Chrome may hang for tens of seconds.
    - run each `U` flow with at least 2 different inputs (an easy one and a hard one, e.g. high noise); check results and intermediate figures render correctly; screenshot each flow;
    - open `report/index.html`, check all figures render offline, screenshot it.
    A broken flow is Fail: fix it (back to Implement) and repeat.
24. **Compare** each `K` and `E` item with its fixed threshold; verdict is one of **Match**, **Partial match**, **Not reproduced**. Below threshold: run **gap-closing rounds, at most 3**: diagnose from the "Differences from paper" table (a small ablation is allowed, one factor at a time), fix exactly that cause, rerun steps 22–23. After 3 rounds, stop and report the causes found and those still suspected.

### Report

25. Reopen `adlc-report` and reply to the owner in `adlc-report` order (verdict, this table, check against the approved contract, open decisions), **attaching screenshots of the demo app and the evaluation page plus `report/index.html`** (`attach_file`), the command to open the app (`./run_demo.sh`, local address) so the owner can try it. Every number comes from the table or `metrics.json`, never from another run.

## Output

Completion report (fill every row; an empty row states why):

```
# Reproduction report: {paper title} (paper-prototype)

| Item | Value |
|---|---|
| Paper | {title; source: arXiv/URL/PDF/QACI Data; full text or abstract only} |
| Reproduction level | {A/B/C/D and why; what ran for real, what was scaled down or replayed} |
| Data used | {paper's dataset or synthesized; size; why} |
| Main experiment | {`./reproduce.sh`, run time on the clean clone, number of seeds} |
| Paper results | {method: number (table/section)} |
| Reproduced results | {method: number (`metrics.json:<key>`), or "not run" with the reason} |
| Paper's main claims | {K1, K2…: reproduced / not / not tested, with numbers and keys} |
| Differences from paper | {table; which items explain the gaps} |
| Gap-closing rounds | {count; what changed each round; before/after numbers} |
| Verdict | Match / Partial match / Not reproduced (per thresholds fixed in the plan) |
| Tests | {passed}/{total}; flag-off parity: {Pass/Fail/n.a.} |
| Demo app | {`./run_demo.sh`, local address, each `U` flow tried with which inputs; screenshots attached} |
| Evaluation page | {`report/index.html` path; screenshot attached} |
| Verified by me | {commands and real output; anything "not verified" with reason} |
| Approvals | {each point: owner-approved or "Self-approved: <point> — <reason> — <evidence>"} |
| Out of scope | {as in the contract, or new items with reasons} |
| Time to complete | {from the progress log} |
```

## Quality checklist

- [ ] Full paper read (or "abstract only" approved); contract items sourced and verified.
- [ ] Level A/B/C/D chosen from measured hardware and shown in the app.
- [ ] Plan approved by the owner via the Plan approval card before any code.
- [ ] Thresholds fixed in the plan; proxy checks labeled and capped at Partial match.
- [ ] Every "Reproduced" number cites a `metrics.json` key; every "Paper" number cites method and table.
- [ ] `reproduce.sh` passed on a clean clone within budget, log saved; runs on CPU.
- [ ] Every `U` flow exercised in a real browser with 2+ inputs and screenshotted; report page renders offline, no base64, no CDN.
- [ ] Flag-off parity proven when integrating into an existing app.

## Guardrails

**Never**
- Break a hard rule above (invented numbers, loosened thresholds, self-approved plan, unbounded commands, invented data conditions).
- Run the full config before measuring, hard-code a GPU type, or ask for approval with `NEEDS INPUT:`.
- Let flag-off behavior differ from the base branch.

**Ask first**
- Renting a GPU, paid APIs or external services (always a card, even when self-approving).
- Downloading data that requires accepting terms or a login.
- A time budget other than 10 minutes; changing `metrics.py`, thresholds or limits after plan approval.
- Continuing with only the abstract; choosing among several QACI Data results.

## Example

Request: "Here's an arXiv link on lead-wise attention for ECG classification. Build a small prototype of the core method."

Outline: read the full text; check hardware (8 cores, no GPU); write `CONTRACT.md` (K1: attention fusion beats single-lead by ~3 F1 points, Table 2; D1: PTB-XL subset; U1: upload an ECG, see per-lead attention weights and the fused prediction); propose level A; SPEC approval. `PLAN.md` with sourced `config.yaml`, differences (100 Hz subset, 5 classes), threshold "fusion − single-lead F1 ≥ 2.0 for Match, > 0 for Partial match"; send Plan approval card and wait. Build in plan order, Flask app with `/?record=…` URLs; 3 seeds in 7 minutes. Push approval, review, Merge approval, merge; clean-clone run and browser screenshots of each flow with a clean and a noisy record. Verdict: Partial match (`metrics.json:fusion.f1_mean` vs `metrics.json:single.f1_mean`), with screenshots and `report/index.html` attached.
