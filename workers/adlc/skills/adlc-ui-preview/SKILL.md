---
name: adlc-ui-preview
title: Preview UI changes on your own desktop
description: "Preview UI changes: build the app, run it on your own desktop, capture before/after screenshots and attach them to the Push approval card."
triggers: adlc ui preview, preview ui changes, ui screenshots, before and after screenshots, xem trước giao diện trên desktop riêng
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Preview UI changes on your own desktop

During the Verify phase, run the changed UI on your own desktop, walk through every changed screen like a real user, and attach screenshots to the **Push approval** card so the owner can see (or try) the change before it leaves the system.

Your desktop path (inside the desktop `/home/cua/workspace`, on the host a dedicated folder) is in the **Your own desktop** section of the system instructions. If that section is missing (you have no desktop), skip this skill and write "could not preview on the desktop" in the card.

## When to use

- Every piece of work that changes the user interface: screens, components, styles, click flows.
- Run it **after committing with green tests, before the Push approval card** (skill `adlc-approval`). No UI change, no preview.

**Not for:** automated browser checks of acceptance criteria (`adlc-verify-browser`), public demo links (`deploy-render`), code review (`adlc-code-review`).

## Inputs

| Input | Required | Default |
|---|---|---|
| Worktree and branch with the committed UI change | yes | — |
| Build command from the repository README | yes | e.g. `npm ci --include=dev && npm run build` |
| Team dev config `<repos folder>/.env/<repo>.env` | no | build without it |
| Port | no | `VITE_AZURE_REDIRECT_URI` port if set, else 5001–5009 |
| List of changed screens | yes | from the plan |

## Procedure

1. **Build on the host**, in your worktree: install dependencies and build the static bundle per the repository README (e.g. `npm ci --include=dev && npm run build`). The repository's dev config (if any) lives in the team's `.env` folder next to the repositories (Environment section), e.g. `<repos folder>/.env/<repo>.env`: load it into **the build command itself** — never copy it into the worktree, commit it or print it: `set -a; . "<repos folder>/.env/<repo>.env"; set +a; npm run build`. Without that file, build normally. Never use production data or keys.
2. **Copy the build to the desktop**: the desktop's host folder + `/preview/<branch>` (replace `/` with `-`), e.g.
   `rm -rf "<desktop>/preview/<branch>" && mkdir -p "<desktop>/preview/<branch>" && cp -r dist/. "<desktop>/preview/<branch>/"`.
   Inside the desktop it is `/home/cua/workspace/preview/<branch>`.
3. **Serve it inside the desktop** (commands run in the VM, e.g. `vm_exec`), in the background. Use a server that returns `index.html` for every path (single-page apps with routes like `/login`, `/projects`). **Port:** if the config has `VITE_AZURE_REDIRECT_URI` (e.g. `http://localhost:5173/login`), serve on exactly that port and open it via `localhost` so Microsoft sign-in matches the redirect; otherwise use 5001–5009.
   ```bash
   cat > /home/cua/workspace/.tools/spa.py <<'PY'
   import http.server, os, sys
   root, port = sys.argv[1], int(sys.argv[2])
   class H(http.server.SimpleHTTPRequestHandler):
       def __init__(self, *a, **k): super().__init__(*a, directory=root, **k)
       def send_head(self):
           if not os.path.exists(self.translate_path(self.path)): self.path = "/index.html"
           return super().send_head()
   http.server.ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
   PY
   nohup python3 /home/cua/workspace/.tools/spa.py /home/cua/workspace/preview/<branch> <port> >/tmp/preview.log 2>&1 &
   ```
   Pages behind Microsoft sign-in: open `http://localhost:<port>`, then **ask the owner to Take control and sign in themselves** (the team's test account if any; you never type a password or MFA code). Only after the owner signs in and clicks "Hand control back" do you navigate to the screens to preview. If sign-in is not possible, render that exact page with mock data (following the repository's tests), in a frame **as wide as the real page** (minus sidebar and padding), and state clearly in the card that the screenshot is a mock.
4. **Open the desktop's Firefox** at `http://localhost:<port>` and walk through **every changed screen** like a real user; capture each screen to a file and attach it to the chat with `attach_file` (the desktop's host folder + `/preview/shots/…`). If a computer tool (screenshot/click) is available in this turn, use it; otherwise use the script below inside the desktop (e.g. `vm_exec`). On first use, install the libraries into the desktop's persistent folder (kept across restarts):
   ```bash
   python3 -m pip install -q --target /home/cua/workspace/.tools pillow python-xlib
   mkdir -p /home/cua/workspace/preview/shots
   cat > /home/cua/workspace/.tools/ui.py <<'PY'
   import sys, time
   from Xlib import X, display
   from Xlib.ext import xtest
   from PIL import ImageGrab
   d = display.Display(":1")
   def click(x, y):
       d.screen().root.warp_pointer(x, y); d.sync()
       xtest.fake_input(d, X.ButtonPress, 1); xtest.fake_input(d, X.ButtonRelease, 1); d.sync(); time.sleep(0.4)
   for arg in sys.argv[1:]:
       if arg.startswith("click="): click(*map(int, arg[6:].split(",")))
       elif arg.startswith("wait="): time.sleep(float(arg[5:]))
       else: ImageGrab.grab(xdisplay=":1").save(arg)
   PY
   ```
   Open the page: `DISPLAY=:1 nohup firefox http://localhost:<port> >/dev/null 2>&1 &`. Measure the real page width (windows of 1366 and 1440 px). Capture and click:
   `PYTHONPATH=/home/cua/workspace/.tools python3 /home/cua/workspace/.tools/ui.py wait=3 /home/cua/workspace/preview/shots/<branch>-1.png click=640,400 /home/cua/workspace/preview/shots/<branch>-2.png`.
   *Check:* view each screenshot (read the file at the host path) to find click coordinates and confirm it shows the right screen; if Firefox shows a dialog (e.g. translate page), close it before capturing. For a before/after comparison, build the base branch into `preview/base`, serve it on another port, and capture both.
5. **Push approval card** (skill `adlc-approval`) — add:
   - "The UI is open on my desktop at http://localhost:<port>: watch it in the Screen tab or click Take control to try it yourself. Screenshots of the screens (attached files) are just above."
   - which screens were viewed and what the owner should look at; which parts could not be previewed (no backend, sign-in required, …) and why.
   - Keep the preview server running until the owner answers the card.
6. If the owner chooses **Request changes**: fix, commit, rebuild, repeat from step 2, then ask again with a new card.
7. **Clean up** (owner approved and the push is done): stop the preview server (`pkill -f "spa.py /home/cua/workspace/preview/<branch>"`), close Firefox, delete `preview/<branch>` and the branch's screenshots on the desktop.

## Output

Added to the Push approval card:

```markdown
**UI preview**
- Live on my desktop: http://localhost:<port> — Screen tab, or Take control to try it
- Screenshots (attached above): <branch>-1.png (<screen>), <branch>-2.png (<screen>)[, base vs. branch]
- Screens viewed: <list> — please check: <what to look at>
- Not previewed: <part> — <reason> | none
- Mock data: <screen> (sign-in not possible) | none
```

If there is no desktop: "UI preview: could not preview on the desktop."

## Quality checklist

- [ ] Built after a commit with green tests, before the Push approval card
- [ ] Dev config loaded only into the build command; nothing copied, committed or printed
- [ ] Every changed screen visited and captured; screenshots checked by viewing them
- [ ] Before/after captured when a base version exists
- [ ] Mock screenshots labelled as mock
- [ ] Preview server kept running until the owner answers; cleaned up after the push

## Guardrails

**Never**
- Copy source code, `.env` files, keys or tokens to the desktop — only the static build. Backend secrets are never used for previews.
- Open external sites or sign in to real accounts in the desktop's Firefox for this work.
- Type a password or MFA code yourself.
- Commit screenshots or the `preview/` folder to the repository.
- Use production data or keys.

**Ask first**
- The owner to Take control and sign in when a page requires Microsoft sign-in.

## Example

**Request (internal step):** a feature changed the project list and project detail screens; tests are green and committed on `feature/project-cards`.

**Response outline:** `npm ci --include=dev && npm run build` with the team `.env` loaded → copy `dist/` to `<desktop>/preview/feature-project-cards` → serve on 5173 (redirect URI present) → ask the owner to Take control and sign in → capture both screens on the branch and on `preview/base` → view the shots, attach them → Push approval card with the live link, screenshots, what to check, and "project detail with an empty list not previewed: no seed data" → after approval and push, stop the server and delete the preview files.
