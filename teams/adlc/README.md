# ADLC

**Autonomous software delivery, end to end.** One agent for the full delivery lifecycle: requirements, planning, implementation, verification and deployment, with your approval before anything ships.

QACI Duo's single-agent software worker (ADLC: Agentic Development Lifecycle). The owner assigns work in a direct chat; ADLC classifies it, writes measurable acceptance criteria, plans, implements with tests, verifies the result under real conditions, and merges. On request, it pushes to the owner's own GitHub or Azure DevOps and deploys a demo, always asking for approval before any external action.

## Playbook

- **Classify the task** — Classify work the owner assigns (feature, bugfix, research, chore, paper-prototype), judge whether it is a Small task, and open the matching process skill. ([SKILL.md](../../playbooks/adlc-triage/SKILL.md))
- **Process: implement a feature** — Feature process run end to end by one agent: SPEC with measurable AC, test and implementation plan, code with tests, self-review, verification, merge and a Completion report. ([SKILL.md](../../playbooks/adlc-feature/SKILL.md))
- **Process: fix a bug** — Bugfix process run end to end by one agent: triage automated alerts, bug report, reproduce, failing test first, root-cause fix, verify, merge and a Completion report. ([SKILL.md](../../playbooks/adlc-bugfix/SKILL.md))
- **Process: research** — Research process run by one agent: research brief, fair measurement plan, spike branches, comparison with real numbers, and an evidence-backed recommendation committed to reports/. ([SKILL.md](../../playbooks/adlc-research/SKILL.md))
- **Process: maintenance (chore)** — Maintenance process run by one agent for dependencies, configuration and cleanup: baseline tests, scoped change, before/after comparison, merge and a Completion report, with no user-visible behavior change. ([SKILL.md](../../playbooks/adlc-chore/SKILL.md))
- **Approval at the four ADLC approval points** — Decide whether to self-approve or ask the owner with an approval card at SPEC, plan, push and merge, based on the Approval points line; use at every approval point. ([SKILL.md](../../playbooks/adlc-approval/SKILL.md))
- **Progress log and Completion report** — Keep the per-task progress log as events happen and send the owner one Completion report with real numbers, acceptance evidence and self-approvals. ([SKILL.md](../../playbooks/adlc-report/SKILL.md))
- **Process: paper to prototype** — Turn a research paper into an end-to-end prototype (trained model, step-by-step demo app, evaluation page) compared honestly against the paper, never inventing numbers. For paper-prototype work. ([SKILL.md](../../playbooks/adlc-paper-prototype/SKILL.md))
- **Local git in the ADLC flow** — Local git for ADLC: a work branch per task, complete commits, a PR is a branch, and you merge it yourself after review and approval. ([SKILL.md](../../playbooks/adlc-git-local/SKILL.md))
- **Work on an existing GitHub or Azure DevOps repository** — Clone an existing GitHub or Azure DevOps repository from a link, do the work on a dedicated branch, push that branch with the owner's approval and optionally open a pull request. Never touches the base branch. ([SKILL.md](../../playbooks/adlc-git-remote/SKILL.md))
- **Self-review before merge** — The agent's own review of a branch before Merge approval: run the tests and the app yourself, exercise every test case under real conditions, and pass a fixed checklist with evidence. ([SKILL.md](../../playbooks/adlc-code-review/SKILL.md))
- **Verify in a real browser** — Run the app yourself, open it in a real browser, walk through every user flow per test case and capture screenshots committed to the repo as evidence. ([SKILL.md](../../playbooks/adlc-verify-browser/SKILL.md))
- **Preview UI changes on your own desktop** — Preview UI changes: build the app, run it on your own desktop, capture before/after screenshots and attach them to the Push approval card. ([SKILL.md](../../playbooks/adlc-ui-preview/SKILL.md))
- **Publish code to the owner's GitHub** — Push the merged base branch to the owner's GitHub, optionally create a release with build files and list it on FCode Market. Use after the merge when DEPLOY.md selects GitHub. ([SKILL.md](../../playbooks/deploy-github/SKILL.md))
- **Publish code to the owner's Azure DevOps** — Push the merged base branch to the owner's Azure DevOps (Azure Repos) with a PAT, optionally via a pull request. Composio has no managed Azure DevOps toolkit, so the PAT is the primary method. Use when DEPLOY.md selects Azure DevOps. ([SKILL.md](../../playbooks/deploy-azure-devops/SKILL.md))
- **Deploy a demo to Render** — Deploy an app from the owner's GitHub repository to Render and return a working demo link, with cost estimate and how to stop it. Use after the merge when DEPLOY.md includes Render. ([SKILL.md](../../playbooks/deploy-render/SKILL.md))

Source: `workers/adlc.md` on `main`.
