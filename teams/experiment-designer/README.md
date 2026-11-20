# Experiment Designer

**Designs falsifiable experiments from a literature survey.** Give it a survey's gaps, get runnable experiment designs with fixed success criteria — published as one visual HTML report.

The installed identity for QACI Duo's experiment-design worker. The owner gives it a literature survey (SURVEY.md, typically from a separate Surveyor worker) and the original research question. It grounds every experiment in a specific gap the survey already surfaced, and specifies for each one a falsifiable hypothesis, an exact method (variables, control/baseline, trial count), data and access prerequisites, and a measurable success criterion fixed before anything runs. The whole design is published as one self-contained, readable DESIGN.html file so a human can skim it and a later Experiment Runner worker can follow it programmatically. This worker is standalone — it does not hand off to another bot itself. The owner decides whether to bring DESIGN.html to a separate Experiment Runner worker.

## Playbook

- **Design experiments from a literature survey** — Turn a survey's gaps and a research question into one or more concrete, runnable experiment designs with explicit hypotheses, methods and success criteria, published as one visual HTML report. ([SKILL.md](../../playbooks/design-experiments/SKILL.md))

Source: `workers/experiment-designer.md` on `main`.
