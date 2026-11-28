## Change

<!-- Which playbook or worker, and what it lets a user get done. -->

## Checklist

- [ ] This pull request targets `dev` (only a code owner opens `dev` → `main`)
- [ ] Only files under `workers/<worker>/` (`worker.yaml`, `BRIEF.md`, `souls/`, `skills/<name>/SKILL.md`, `benchmark.yml`, `runs/*.json`) and/or shared `skills/<name>/` changed (plus README if a table changed)
- [ ] `name` matches the folder; `id` matches the file name
- [ ] The `release` of every affected worker is bumped
- [ ] The playbook has every section in FORMAT.md, with *Check:* lines and an *Output* template
- [ ] `npm test` passes (or the CI check on this pull request is green)
- [ ] Every changed skill has a `benchmark.yml` and a run (`runs/local.json` or `runs/dev.json` in the skill's folder) that `node scripts/benchmark.mjs check` accepts
- [ ] I read [REVIEW_CHECKLIST.md](../REVIEW_CHECKLIST.md) and the change meets every BLOCKER item
- [ ] Tried in QACI Duo (Skills library or Templates → Import)
- [ ] New or changed app / connection / tool name: slug checked on Composio, every tool name found by `COMPOSIO_SEARCH_TOOLS`, one real call worked (details under *Tried on*)

## Safety

- [ ] No tokens, passwords, personal data, internal names, binaries or scripts
- [ ] *Guardrails* covers actions that need approval (sending, submitting, deleting, costly runs)
- [ ] The worker is told to cite sources and never invent papers, numbers or people

## Tried on

<!-- A real request you gave the worker and what came back. -->
