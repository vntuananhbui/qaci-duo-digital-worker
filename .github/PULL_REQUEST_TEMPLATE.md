## Change

<!-- Which playbook or worker, and what it lets a user get done. -->

## Checklist

- [ ] Only `skills/<name>/SKILL.md` and/or `workers/<worker>.md` changed (plus README if a table changed)
- [ ] `name` matches the folder; `id` matches the file name
- [ ] The `release` of every affected worker is bumped
- [ ] The playbook has every section in FORMAT.md, with *Check:* lines and an *Output* template
- [ ] `npm test` passes (or the CI check on this pull request is green)
- [ ] Tried in QACI Duo (Skills library or Templates → Import)
- [ ] New or changed app / connection / tool name: slug checked on Composio, every tool name found by `COMPOSIO_SEARCH_TOOLS`, one real call worked (details under *Tried on*)

## Safety

- [ ] No tokens, passwords, personal data, internal names, binaries or scripts
- [ ] *Guardrails* covers actions that need approval (sending, submitting, deleting, costly runs)
- [ ] The worker is told to cite sources and never invent papers, numbers or people

## Tried on

<!-- A real request you gave the worker and what came back. -->
