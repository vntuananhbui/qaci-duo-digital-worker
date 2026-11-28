---
name: adlc-verify-browser
title: Verify in a real browser
description: Run the app yourself, open it in a real browser, walk through every user flow per test case and capture screenshots committed to the repo as evidence.
triggers: adlc verify browser, verify in browser, browser verification, test the ui in a browser, verify bằng trình duyệt
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Verify in a real browser

Run the app yourself and use it like a real user, one test case at a time, in a real browser, with a committed screenshot per test case as evidence. This is the Verify phase for any work with a UI; the Pass / Fail verdict is yours.

Your git skill is `adlc-git-local`; the **base branch** comes from the assignment (see the soul's "Environment"). The path of the repository clone inside the VM is given in the **Environment** section of your system instructions.

## When to use

- Verifying work that has a UI or user flow before merge (feature, bugfix, paper-prototype demo app).
- Re-verifying after a fix for a failed test case.

**Not for:** before/after screenshots of a UI change while implementing (`adlc-ui-preview`); code review (`adlc-code-review`); API-only or CLI-only checks (exercise them with `curl` or the command, per the soul's "Running tests").

## Why a VM

The bot's built-in browser can only reach localhost ports the bot itself runs. The Local VM is a Linux machine with a desktop and Firefox, where you run the app and operate it like a real user.

The VM **cannot see host folders**; it only sees `/home/cua/workspace`. The repository already has a clone there.

## Inputs

| Input | Required | Default |
|---|---|---|
| Repository and base branch | yes | from the assignment |
| Test cases (IDs and expected results) | yes | from the approved SPEC / plan |
| Task name (for screenshot file names) | yes | the task's plan folder name |
| App start command and port | no | the repository's own command; port 5000 |

## Procedure

1. On the **host**, pull the latest base branch into the clone: `git -C <host clone path> pull --ff-only`.
   *Check:* the clone is at the expected commit.
2. In the **VM** (`vm_exec`): go to `/home/cua/workspace/<repo>`, install requirements, and start the app on port 5000 in the background.
   - If the VM's Python cannot install the pinned libraries, use a virtual environment with a different Python version and record that in the report.
3. Open the **desktop Firefox** at `http://127.0.0.1:5000` and act like a real user for each test case: click, type, choose files, read the results.
4. Take a screenshot for **every test case**. Screenshots must not live only as chat attachments, because others cannot read your thread:
   - save in the VM to `/home/cua/workspace/<repo>/reports/screenshots/<task>-<TC>.png`;
   - copy into the main repository's `reports/screenshots/` and commit (under your name, with `adlc-git-local`);
   - put that path in the **Evidence** column of the acceptance table.
5. Record Pass / Partial pass / Fail for each test case.
   - Fail: fix it yourself (Implement phase), review it again, and re-run this skill for the affected test cases.
   - If a test case or criterion cannot be met (it conflicts with a constraint), tell the owner instead of working around it.
6. Stop the app when done.

**No browser:** if the VM does not start, verify with `curl` or a script, and state clearly in the report that it was **not verified through a browser**, with the reason.

## Output

```
| TC | Steps performed | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|
| TC1 | {what you did in the browser} | {expected} | {observed} | Pass / Partial pass / Fail | reports/screenshots/<task>-TC1.png |
```

Plus, when applicable: "Not verified through a browser: {reason}; verified with {curl/script}" and any venv/Python-version deviation.

## Quality checklist

- [ ] Clone pulled to the latest base branch before testing.
- [ ] Every test case exercised in the real browser, not only via API calls.
- [ ] One screenshot per test case, committed under `reports/screenshots/` and linked in the Evidence column.
- [ ] Each test case has Pass / Partial pass / Fail; every Fail was fixed and re-verified, or reported.
- [ ] Any fallback (no browser, different Python) is stated with the reason.

## Guardrails

**Never**
- Mark a test case Pass without having exercised it and captured its screenshot.
- Leave evidence only as a chat attachment.
- Work around an unachievable criterion silently.
- Sign in to external services through the browser.

**Ask first**
- Changing a test case or acceptance criterion that turns out to be unachievable.

## Example

Request: verify the CSV export fix (TC1: export with an active filter, TC2: export without a filter).

Outline: pull `main` into the clone; in the VM install requirements and start the app on 5000; in Firefox apply a filter, click Export, open the file (TC1), then repeat without a filter (TC2); save `reports/screenshots/csv-export-TC1.png` and `-TC2.png`, copy and commit them; fill the table with Pass for both and the two paths as evidence.
