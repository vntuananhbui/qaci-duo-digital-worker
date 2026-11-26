---
name: read-paper
title: Close-read papers into evidence cards
description: Close-read verified papers from their full text (arXiv HTML with tables, or Exa contents) into cards whose every number carries its table or section, so later answers never quote numbers from memory or abstracts.
triggers: read this paper, summarise this paper, extract results table, paper card
tags: research, literature, reading
license: Unspecified
author: QACI Duo
compatibility: Python 3 with network access to arxiv.org; Exa app connection for papers not on arXiv
---

# Read papers

## Inputs
The VERIFIED entries to read (from `verified.jsonl`), usually the top 5–8 for a survey or the closest 3–5 for a novelty check. Read them as one batch.

## Procedure

1. **Fetch all full texts in one command.** Save the helper below once as `paper_text.py` (exactly as written), then run it on every arXiv ID in the batch:
   `python3 paper_text.py 2401.15077 2211.17192 ...` (foreground, Bash timeout at least 360000 ms; it stops itself after 5 minutes)
   Run it from the topic folder (`cd research/<slug>`) so `fulltext/` sits next to `cards/` and travels with them to the next step. It writes `fulltext/<id>.txt` with section headings (`## 4 Experiments`), table captions (`[CAPTION] Table 1 : ...`) and table rows (`| V 7B | 3.33x | ...`).
   - Papers with no arXiv ID, or a `NO_HTML` line: get the text with `EXA_GET_CONTENTS_ACTION` through `COMPOSIO_MULTI_EXECUTE_TOOL` (one URL per call, `text: true`) and save it to `fulltext/<key>.txt`; if that fails too, the card is `depth: abstract-only`.
2. **Locate, then read.** For each file:
   `grep -n -E "^## |\[CAPTION\]" fulltext/<id>.txt` gives the map. Read the abstract, the main results table(s) and the section that discusses limitations or conclusion (use Read with offset/limit on those line ranges). Do not read whole files.
3. **Write one card per paper**, `cards/<key>.md`, **immediately after reading that paper and before opening the next one** (cards written at the end get lost when the context fills up):

```markdown
# <resolved title> (<venue> <year>)  <url>
depth: full-text | abstract-only        source read: <fulltext file or url>
- Problem:
- Method (core idea in 2 sentences):
- Data and split:
- Metrics and baselines:
- Headline results: <number, setting> (Table N) ; <number> (Sec. N)
- Code / data release: <url> | "not reported" (if the paper names none, one `EXA_SEARCH` with `category: "github"` for the official repo; mark it "found by search")
- Compute reported: <GPUs, hours> (Sec. N) | "not reported"
- Limitations stated by the authors: <...> (Sec. N)   | "none stated"
- Relevance to the user's topic or idea:
```

   - *Check:* every number in the card was copied from a table row or sentence you just read and has `(Table N)`, `(Fig. N)`, `(Sec. N)` or `(abstract)` next to it.
4. Run `ls cards | wc -l` and report how many cards are full-text.

## Helper

```python
# usage: python3 paper_text.py <arxiv_id> [more ids...]   -> writes fulltext/<id>.txt, prints one status line per id
import sys, re, os, html, time, urllib.request
UA = {"User-Agent": "literature-read/0.2"}
DEADLINE = time.time() + 300   # hard time budget: stops after 5 minutes, remaining ids are reported as SKIPPED
left = lambda: DEADLINE - time.time()
def fetch(url):
    for i in range(3):
        if left() < 5: return None
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=max(3, min(30, left()))).read().decode("utf8", "ignore")
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            time.sleep(4 * (i + 1))
        except Exception: time.sleep(4 * (i + 1))
    return None
def to_text(raw):
    raw = re.sub(r"(?is)<(script|style|nav|header|footer|math)[^>]*>.*?</\1>", " ", raw)
    raw = re.sub(r"(?is)<annotation[^>]*>(.*?)</annotation>", r" \1 ", raw)
    def table(m):
        rows = re.findall(r"(?is)<tr[^>]*>(.*?)</tr>", m.group(0))
        cells = lambda r: [re.sub(r"\s+", " ", html.unescape(re.sub(r"(?s)<[^>]+>", " ", c))).strip() for c in re.findall(r"(?is)<t[dh][^>]*>(.*?)</t[dh]>", r)]
        return "\n[TABLE]\n" + "\n".join("| " + " | ".join(cells(r)) + " |" for r in rows) + "\n[/TABLE]\n"
    raw = re.sub(r"(?is)<table[^>]*>.*?</table>", table, raw)
    raw = re.sub(r"(?i)<h[1-6][^>]*>", "\n\n## ", raw)
    raw = re.sub(r"(?i)<(figcaption|caption)[^>]*>", "\n[CAPTION] ", raw)
    raw = re.sub(r"(?i)</(p|div|li|tr|h[1-6]|figcaption|caption|table)>", "\n", raw)
    t = html.unescape(re.sub(r"(?s)<[^>]+>", " ", raw))
    t = re.sub(r"[ \t\r\f\v]+", " ", t)
    return re.sub(r"\n\s*\n+", "\n\n", t).strip()
os.makedirs("fulltext", exist_ok=True)
for aid in sys.argv[1:]:
    aid = re.sub(r"v\d+$", "", aid.strip())
    if left() < 10:
        print(f"{aid}\tSKIPPED\ttime budget used up; rerun on the skipped ids"); continue
    url = "https://arxiv.org/html/" + aid
    raw = fetch(url)
    if not raw or "<article" not in raw:
        print(f"{aid}\tNO_HTML\tuse Exa EXA_GET_CONTENTS_ACTION or https://arxiv.org/pdf/{aid}"); continue
    text = to_text(raw)[:250000]
    open(f"fulltext/{aid}.txt", "w").write(f"SOURCE: {url}\n\n{text}")
    caps = len(re.findall(r"\[CAPTION\] *Table", text))
    print(f"{aid}\tOK\t{len(text)} chars\t{caps} table captions\tfulltext/{aid}.txt")
    time.sleep(1)
```

## Guardrails
- Read the saved text yourself (grep + Read). Do not hand reading to a subagent or rely on a WebFetch summary: a summary loses the table rows, so its numbers cannot be located.
- Never fill a field you did not read; write "not reported".
- A number with no location does not go into the card.

**Next:** check the read gate in the playbook, then open the `map-field` skill (read its SKILL.md) (always), then the `check-novelty` skill if the user has an idea or asks "has this been done". When the `design-experiments` playbook sent you here, go back to the step that needed it instead.
