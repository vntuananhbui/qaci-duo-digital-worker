---
name: verify-citations
title: Verify citations against arXiv and CrossRef
description: Resolve each paper against arXiv and CrossRef, label it VERIFIED, SUSPICIOUS or NOT FOUND by title match, and write verified.jsonl with the registry's own metadata.
triggers: verify citations, check my references, does this paper exist, check venue
tags: research, citations, verification
license: Unspecified
author: QACI Duo
compatibility: Python 3 with network access to arXiv, CrossRef and OpenAlex
---

# Verify citations

## Inputs
`shortlist.jsonl`, a `.bib` file, or a pasted reference list.

## Procedure

1. Put the references into a JSON-lines file with at least `title` and, when known, `arxiv` or `doi` (copied from the search results). When checking a user's reference list, also copy the venue and year **as the user wrote them** into `claimed_venue` and `claimed_year`.
2. Save the helper below once as `verify.py` (exactly as written; do not rewrite it) and run `python3 verify.py shortlist.jsonl > verified.jsonl` **in the foreground** with a Bash timeout of at least 360000 ms (never as a background task). It stops itself after 5 minutes and marks any rows it could not reach as LOOKUP FAILED; rerun only those rows if they matter. It batches arXiv IDs (one call per 20), falls back to CrossRef by DOI, then title search, and retries by itself.
   - **VERIFIED**: title similarity ≥ 0.85. **SUSPICIOUS**: 0.6–0.85. **NOT FOUND**: no record. **LOOKUP FAILED**: the registry did not answer.
   - For papers that claim a venue, or that the registry only knows as a preprint, it asks OpenAlex for the peer-reviewed venue: `published_in`, `published_year`, and `venue_check` = MATCH / MISMATCH (status becomes `VERIFIED, VENUE MISMATCH`) / UNCONFIRMED. Use `published_in` as the venue when citing; a paper with no peer-reviewed venue on record is cited as arXiv.
3. **Venue still UNCONFIRMED and it matters** (a reference check, a paper summary, the venue of a key paper): one `EXA_SEARCH` per paper with the exact title and `includeDomains: ["openreview.net", "proceedings.neurips.cc", "papers.nips.cc", "proceedings.mlr.press", "openaccess.thecvf.com", "aclanthology.org", "dl.acm.org", "ieeexplore.ieee.org", "usenix.org", "ndss-symposium.org"]`, batched in one call. A hit on the venue's own site confirms the venue (record the URL); no hit leaves it "could not confirm", which is not the same as wrong.
4. SUSPICIOUS: open the URL once and decide by hand; record why. LOOKUP FAILED: run the helper once more on just those lines; if they still fail, list them under "To re-check". Do not loop or sleep-wait.
5. From now on use the `resolved_*` fields (title, authors, year, venue, url) for every citation.
   - *Check:* the counts line the helper prints is copied into `search_log.md`.

## Helper

```python
# usage: python3 verify.py shortlist.jsonl [seconds, default 300] > verified.jsonl   (summary counts go to stderr)
# Each input line: {"title", optional "arxiv", "doi", and the venue/year the citation CLAIMS as "claimed_venue", "claimed_year"}
import sys, json, re, time, difflib, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from collections import Counter
UA = {"User-Agent": "literature-check/0.2"}
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", re.sub(r"\s+", " ", (s or "").lower())).strip()
sim = lambda a, b: difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()
DEADLINE = time.time() + (int(sys.argv[2]) if len(sys.argv) > 2 else 300)   # hard time budget in seconds (default 5 min)
left = lambda: DEADLINE - time.time()
def get(url):
    for i in range(3):
        if left() < 5: break
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=max(3, min(25, left()))).read()
        except urllib.error.HTTPError as e:
            if e.code in (404, 410): return None
            time.sleep(min(3 * (i + 1), max(0, left())))
        except Exception: time.sleep(min(3 * (i + 1), max(0, left())))
    raise RuntimeError("registry did not answer" if left() >= 5 else "time budget used up")
NS = {"a": "http://www.w3.org/2005/Atom"}
def arxiv(params):
    data = get("https://export.arxiv.org/api/query?" + urllib.parse.urlencode(params)); time.sleep(3)
    out = []
    for e in (ET.fromstring(data).findall("a:entry", NS) if data else []):
        t = e.find("a:title", NS)
        if t is None or not t.text or t.text.strip().lower() == "error": continue
        aid = re.sub(r"v\d+$", "", e.find("a:id", NS).text.rsplit("/abs/", 1)[-1])
        out.append({"title": " ".join(t.text.split()), "authors": [a.find("a:name", NS).text for a in e.findall("a:author", NS)][:6],
                    "year": int(e.find("a:published", NS).text[:4]), "venue": "arXiv", "arxiv": aid, "url": "https://arxiv.org/abs/" + aid})
    return out
def crossref_item(m):
    return {"title": (m.get("title") or [""])[0], "authors": [f"{a.get('given','')} {a.get('family','')}".strip() for a in m.get("author", [])][:6],
            "year": (m.get("issued", {}).get("date-parts") or [[None]])[0][0], "venue": (m.get("container-title") or [""])[0], "doi": m["DOI"], "url": "https://doi.org/" + m["DOI"]}

ALIASES = {"neurips": ["neural information processing systems", "nips"], "iclr": ["international conference on learning representations"],
    "icml": ["international conference on machine learning"], "cvpr": ["computer vision and pattern recognition"],
    "iccv": ["international conference on computer vision"], "eccv": ["european conference on computer vision"],
    "acl": ["association for computational linguistics"], "emnlp": ["empirical methods in natural language processing"],
    "naacl": ["north american chapter"], "aaai": ["aaai conference"], "ijcai": ["international joint conference on artificial intelligence"],
    "kdd": ["knowledge discovery and data mining"], "icse": ["international conference on software engineering"],
    "fse": ["foundations of software engineering"], "pldi": ["programming language design and implementation"],
    "usenix security": ["usenix security"], "ccs": ["computer and communications security"], "ndss": ["network and distributed system security"],
    "s&p": ["symposium on security and privacy"], "sp": ["symposium on security and privacy"], "aisec": ["artificial intelligence and security"],
    "miccai": ["medical image computing and computer assisted intervention"], "tmlr": ["transactions on machine learning research"]}
VENUE_SRC = {"openalex": True}
NONPEER = r"arxiv|biorxiv|medrxiv|repository|pubmed|zenodo|ssrn|semantic scholar|university|research square"
def venue_names(title, year=None, author=""):
    """Peer-reviewed venues and year for a title: OpenAlex (no key, small shared daily budget; switched off after a 429), then CrossRef."""
    ok_year = lambda y: not year or not y or abs(int(y) - int(year)) <= 1
    if VENUE_SRC["openalex"]:
        try:
            d = urllib.request.urlopen(urllib.request.Request("https://api.openalex.org/works?" + urllib.parse.urlencode(
                {"search": title[:250], "per_page": 5, "select": "title,publication_year,locations"}), headers=UA), timeout=max(3, min(15, left()))).read()
            for w in json.loads(d).get("results", []):
                if norm(title) == norm(w.get("title") or "") and ok_year(w.get("publication_year")):
                    names = [(l.get("source") or {}).get("display_name") or "" for l in w.get("locations", [])]
                    names = [n for n in dict.fromkeys(names) if n and not re.search(NONPEER, n, re.I)]
                    if names: return names, w.get("publication_year")
        except urllib.error.HTTPError as e:
            if e.code == 429: VENUE_SRC["openalex"] = False
        except Exception: pass
    d = get("https://api.crossref.org/works?rows=5&select=title,container-title,issued,type&query.bibliographic=" + urllib.parse.quote((title[:300] + " " + author).strip()))
    for m in (json.loads(d)["message"]["items"] if d else []):
        y = (m.get("issued", {}).get("date-parts") or [[None]])[0][0]
        if norm(title) == norm((m.get("title") or [""])[0]) and ok_year(y) and m.get("container-title") and m.get("type") in ("proceedings-article", "journal-article"):
            return [m["container-title"][0]], y
    return None, None
def venue_matches(claimed, names):
    c = norm(claimed); keys = [k for k in ALIASES if re.search(r"\b" + re.escape(norm(k)) + r"\b", c)]
    for n in names:
        nn = norm(n)
        if c and (c in nn or nn in c): return True
        if any(a in nn for k in keys for a in ALIASES[k]) or any(re.search(r"\b" + re.escape(norm(k)) + r"\b", nn) for k in keys): return True
    return False
rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
ids = sorted({re.sub(r"v\d+$", "", str(r["arxiv"])) for r in rows if r.get("arxiv")})
by_id, failed_batches, venue_budget = {}, 0, [10]   # venue lookups for unclaimed papers: the top 10 rows only
for i in range(0, len(ids), 20):                      # one arXiv call per 20 IDs
    try:
        for c in arxiv({"id_list": ",".join(ids[i:i + 20]), "max_results": 20}): by_id[c["arxiv"]] = c
    except Exception: failed_batches += 1
for r in rows:
    cands, err = [], None
    if left() < 10:   # out of time: report the rest honestly instead of overrunning
        r.update(status="LOOKUP FAILED", match=0, error="time budget used up; rerun on these rows only")
        print(json.dumps(r, ensure_ascii=False)); sys.stdout.flush(); continue
    try:
        aid = re.sub(r"v\d+$", "", str(r.get("arxiv") or ""))
        if aid in by_id: cands.append(by_id[aid])
        if r.get("doi"):
            d = get("https://api.crossref.org/works/" + urllib.parse.quote(r["doi"]))
            if d: cands.append(crossref_item(json.loads(d)["message"]))
        if not cands or max(sim(r["title"], c["title"]) for c in cands) < 0.85:
            d = get("https://api.crossref.org/works?rows=3&query.bibliographic=" + urllib.parse.quote(r["title"][:300]))
            if d: cands += [crossref_item(m) for m in json.loads(d)["message"]["items"] if m.get("title")]
        if not any(norm(r["title"]) == norm(c["title"]) for c in cands):   # no exact title yet: also ask arXiv
            cands += arxiv({"search_query": 'ti:"' + re.sub(r'["]', "", r["title"][:200]) + '"', "max_results": 3})
    except Exception as e:
        err = str(e)[:100]
    best = max(cands, key=lambda c: (round(sim(r["title"], c["title"]), 2), norm(r["title"]) == norm(c["title"]), c.get("venue") != "arXiv"), default=None)
    s = sim(r["title"], best["title"]) if best else 0
    r["status"] = "VERIFIED" if s >= 0.85 else "SUSPICIOUS" if s >= 0.6 else ("LOOKUP FAILED" if err else "NOT FOUND")
    r["match"] = round(s, 2)
    if err: r["error"] = err
    if best and s >= 0.6: r.update({"resolved_" + k: v for k, v in best.items()})
    # venue check: when the citation claims a venue, or the registry only knows the preprint
    if r["status"] == "VERIFIED" and (r.get("claimed_venue") or (venue_budget[0] > 0 and r.get("resolved_venue") in ("arXiv", "", None))):
        if not r.get("claimed_venue"): venue_budget[0] -= 1
        try:
            names, vyear = venue_names(r["resolved_title"], r.get("resolved_year"), ((r.get("resolved_authors") or [""])[0].split() or [""])[-1])
        except Exception:
            names, vyear = None, None
        if names: r["published_in"] = names; r["published_year"] = vyear
        if r.get("claimed_venue"):
            if not names: r["venue_check"] = "UNCONFIRMED (no peer-reviewed venue found in OpenAlex/CrossRef" + ("" if VENUE_SRC["openalex"] else "; OpenAlex quota used up") + ")"
            elif venue_matches(r["claimed_venue"], names) and (not r.get("claimed_year") or not vyear or abs(int(r["claimed_year"]) - int(vyear)) <= 1):
                r["venue_check"] = "MATCH"
            else:
                r["venue_check"] = f"MISMATCH: record says {names[0]} {vyear or ''}".strip(); r["status"] = "VERIFIED, VENUE MISMATCH"
    print(json.dumps(r, ensure_ascii=False)); sys.stdout.flush()
c = Counter(r["status"] for r in rows)
print("counts: " + ", ".join(f"{k} {c[k]}" for k in ("VERIFIED", "VERIFIED, VENUE MISMATCH", "SUSPICIOUS", "NOT FOUND", "LOOKUP FAILED")), file=sys.stderr)
```

## Guardrails
- Never silently replace a NOT FOUND entry. You may suggest the closest real paper as "possibly intended: …" only after it is itself VERIFIED, and label it as a suggestion.
- Report a venue as wrong only when `venue_check` says MISMATCH; UNCONFIRMED means "could not confirm", not "wrong".
- Never cite a SUSPICIOUS or LOOKUP FAILED paper as fact.

**Next:** open the `read-paper` skill (read its SKILL.md) now (survey: top 6–8 VERIFIED by score; novelty: closest 4–5). Do not write the answer yet. When the `design-experiments` playbook sent you here, go back to the step that needed it instead.
