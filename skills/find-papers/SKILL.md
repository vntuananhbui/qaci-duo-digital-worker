---
name: find-papers
title: Find papers for a research question
description: Plan queries from several angles, search scholarly sources, deduplicate and screen candidates with written reasons, and write shortlist.jsonl plus a search log with counts.
triggers: find papers, search the literature, query plan, shortlist papers
tags: research, literature, search
license: Unspecified
author: QACI Duo
compatibility: Python 3 with network access; Exa app connection recommended
---

# Find papers

## Inputs
Topic or question (required); the user's idea; seed papers; scope (default: last 6 years plus foundational work).

## Procedure

1. **Plan queries.** Write 3–4 angles (core problem, method family, benchmarks/datasets, foundations or applications) and 3–5 queries per angle, each 3–8 words, no filler words. Add one "survey" and one "benchmark" variant of the core query. Write them to `search_log.md`.
   - *Check:* queries are not near-duplicates; at least 10 in total.
2. **Search — Exa first.** Exa is your primary search engine, through the Composio tools.
   - If the Composio tools are not loaded yet, load them first (tool search for `COMPOSIO_SEARCH_TOOLS` and `COMPOSIO_MULTI_EXECUTE_TOOL`).
   - Call `COMPOSIO_SEARCH_TOOLS` once to get `EXA_SEARCH`, then run `EXA_SEARCH` through `COMPOSIO_MULTI_EXECUTE_TOOL`, several queries per call, with `category: "research paper"`, `numResults: 10–20`, and a start published date from the scope.
   - Security, systems or software-engineering topics: also run 3–5 queries restricted to the venue domains in the playbook's Connectors table.
   - Use the arXiv helper below only for queries where Exa returned too little, or if Exa fails; say which in `search_log.md`.
   - Seed papers: also search their titles to find close neighbours.
   - Log hits per query and per source in `search_log.md`.
3. **Normalise and dedup.** One JSON line per paper: `{"key", "title", "authors", "year", "venue", "url", "arxiv", "doi", "found_by"}` taken from the search result, not from memory. When a result URL is `arxiv.org/abs/<id>` or `arxiv.org/pdf/<id>`, put `<id>` in `arxiv`; later skills depend on it. Dedup by DOI, then arXiv ID, then lower-cased title without punctuation.
4. **Screen.** Keep a paper only if it addresses the topic's problem in the same domain. Rules: shared keywords across domains do not count; drop results with no abstract and no venue; prefer the scope's years but keep foundational papers. Write a one-line `keep_reason` for each kept paper and a `score` 1–5 for relevance.
   - *Check:* 15–40 kept for a broad field, 8–20 for a narrow one; if fewer than 10, say so.
5. **Write** `shortlist.jsonl` (kept, sorted by score) and add counts to `search_log.md`: `found → deduplicated → kept`.

## arXiv helper

```python
# save as arxiv_search.py; usage: python3 arxiv_search.py "query words" 25 >> candidates.jsonl
import sys, json, urllib.parse, urllib.request, xml.etree.ElementTree as ET
q, n = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 25
url = "https://export.arxiv.org/api/query?" + urllib.parse.urlencode({"search_query": "all:" + q, "max_results": n, "sortBy": "relevance"})
ns = {"a": "http://www.w3.org/2005/Atom"}
root = ET.fromstring(urllib.request.urlopen(url, timeout=30).read())
for e in root.findall("a:entry", ns):
    aid = e.find("a:id", ns).text.rsplit("/abs/", 1)[-1].split("v")[0]
    print(json.dumps({"title": " ".join(e.find("a:title", ns).text.split()), "authors": [a.find("a:name", ns).text for a in e.findall("a:author", ns)][:6],
        "year": int(e.find("a:published", ns).text[:4]), "arxiv": aid, "url": "https://arxiv.org/abs/" + aid,
        "abstract": " ".join(e.find("a:summary", ns).text.split())[:600], "found_by": q}))
```

## Guardrails
- Never add a paper you did not see in a search result.
- A failed search is reported as such, never as "nothing exists".

**Next:** open the `verify-citations` skill (read its SKILL.md) now and run its helper on `shortlist.jsonl`. When the `design-experiments` playbook sent you here, go back to the step that needed it instead.
