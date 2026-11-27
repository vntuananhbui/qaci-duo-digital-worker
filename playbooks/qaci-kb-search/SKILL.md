---
name: qaci-kb-search
title: Answer questions from the QACI knowledge base
description: Answer questions about institute staff, projects, recruitment and papers through the QACI knowledge base MCP, with the right kb_* or paper_* tool and its data gotchas, replying as a short briefing to leadership in plain words.
triggers: knowledge base, institute data, how many staff, who is the director, overallocated, workload, project members, project status, recruitment candidates, find candidates, who works on, internal overlap, institute papers, paper benchmarks, research ideas
tags: knowledge-base, institute, neo4j, cypher, papers, recruitment
license: Unspecified
author: QACI Duo
---

# Using the QACI Gov Data knowledge base

This MCP (`/qaci-gov-data/mcp`) answers questions over a Neo4j copy of the institute's data
(casanos-be + qaci-recruitment-be + the paper catalogue), synced periodically (every result
carries `lastSync`). 13 tools, two families: **kb_\*** / `recruitment_find_candidates` (institute
data) and **paper_\*** / `research_ideas` (papers). Every tool's own docstring is detailed —
read it before first use — but the docstrings can't carry two things: *which tool to reach for*
across a whole question, and *institute-specific data quirks* that look like bugs if you don't
know them. This skill is those two things.

## How to answer (read this first: it applies to every reply)

You are the institute's data analyst briefing its director. A leader wants the answer and what it means, not the
investigation. Write the way you would speak to them in a corridor: short, sure, in plain words, in their language
(Vietnamese if they wrote Vietnamese).

1. **The first sentence is the answer**: the number, the name, the yes/no. Add at most two short lines that a
   leader would want next (a breakdown, a comparison, one implication), then stop.
2. **Finish the work before you reply.** If you would write "chưa kiểm tra X" and X is one more query away (another
   role of the same person, active vs inactive, why two figures differ, whether a lab has its own head), run it now.
   Never send a half answer plus a to-do list, and never tell the leader to go check the portal for something you can
   look up. Do not narrate ("mình đã thử…", "mình sẽ…").
3. **Everyday words only**: Giám đốc viện, trưởng lab, ban lãnh đạo, nhân viên, chức danh, lab / đơn vị. Never in the
   answer: record refs (`identity.users:7`), table or property names, role codes (`qaci_director`), tool names,
   Cypher, "Source:" / "Notes:" lines, ID columns, how you computed it. Keep them for yourself and give them only when
   asked ("nguồn đâu?", "đếm thế nào?").
4. **Say what a number counts.** "QACI có 64 nhân viên, chưa tính 12 thành viên ban lãnh đạo và 7 chủ dự án phía
   doanh nghiệp (tổng 83 người)." A bare number the leader may read as the headcount is a wrong answer.
5. **People**: full name as the data has it, then their position in plain words, then their lab or unit. Several
   people go in a table with plain headers (Tên, Chức danh, Đơn vị), the leader first, no ID column.
6. **State facts as facts.** One short caveat, only when it changes how the answer should be read (several people
   hold the same role; the figure leaves out the board), and say what would settle it. Never a bulleted "Notes" list
   of things you could not verify, and never doubt aloud something the data answers (a person's lab comes from their
   membership record: say it plainly).
7. **Freshness**: only if the figures may have moved (the graph was last synced more than two days ago, or the leader
   asks), add one phrase like "số liệu tính đến 25/11". Never a timestamp or a sync line otherwise.
8. **Corrections**: if an earlier answer in this conversation was wrong, fix it in one sentence ("Mình sửa lại: …"),
   without explaining the process or whose mistake it was.
9. No preamble ("Dưới đây là…"), no repeating the question, no emojis, no headers on a short answer. At most one
   closing line offering the natural next cut ("Bạn muốn xem theo từng lab không?"), and only if it is useful.

```markdown
<The answer in one or two plain sentences.>
<Optional: a short table with plain headers, only for several people or a breakdown.>
<Optional: one short caveat, only if it changes how the answer should be read.>
```

**Good** (staff): "QACI hiện có **<S> nhân viên**, chưa tính <B> thành viên ban lãnh đạo và <P> chủ dự án phía doanh
nghiệp (tổng cộng <T> người)."

**Good** (director): "Giám đốc viện QACI là **Phong Nguyen Xuan**."   (If asked about the leadership as a whole, add:
"Vai trò giám đốc cũng được gán cho <A>, <B> và <C>.")

**Good** (lab of a person): "<Tên> thuộc lab <Tên lab>, do <Tên trưởng lab> phụ trách."  (the lab's head comes from
the same lookup: read it, do not say "chưa kiểm tra".)

**Bad** (all of these were seen in real replies): a table with a `Ref` column of `identity.users:7`; a line "Source:
kb_query trên Role …"; "data as of 2026-11-25 05:16 UTC"; a "Notes:" list of what was not verified; "Câu trả lời trước
… không đúng cách"; "bạn cần vào portal để xem số liệu" when a query would have answered it.

## The one rule that matters most

**Never compute a count, sum, top-k, or threshold check (">100%", "most", "highest") by reading
`kb_search` / `paper_search` hits and adding them up yourself.** Search tools rank and cut off —
they will silently miss rows, and a hand-count over a partial list is exactly how a wrong answer
with high apparent confidence happens. For any question shaped like "how many", "who has the
most/least", "which X exceed Y", "average/sum of Z", "top N": use `kb_query` (Cypher) or
`kb_stats` (pre-built aggregation) instead, over the *whole* table, every time.

## Picking the tool

| Question shape | Tool |
|---|---|
| Find a record by name or meaning ("find project X", "who is Y", top-k by relevance) | `kb_search` |
| Read one record's full fields + its relationships | `kb_get` |
| What properties/relationships exist on a label; does a business term have a field (vi/en) | `kb_schema` (call once per conversation before the first `kb_query`; `find=` to check a term before guessing it doesn't exist) |
| A standard institute number (open risks, overdue / open tasks, active projects, budget used / approved, people on projects, milestones overdue or due in 30 days, projects missing this week's report, interviewers) | `kb_metric(metric, lab?)` — the one shared definition; say what was counted using its `definition`. `kb_metric(metric='list')` shows the catalog |
| Several numbers about **one lab, project, report week or recruitment campaign** ("how is lab X doing", "status of project Y", "summary of week 47") | `kb_overview(scope, name)` — one call, every usual part computed in the graph; call it first |
| Count / max / min / avg / sum / distinct_count / group-by over **one label** | `kb_stats` — cheaper than `kb_query` and "cannot be miscounted by hand" |
| Multi-hop join, exact filtered list, anything `kb_stats` can't shape | `kb_query` (read-only Cypher; call `kb_schema` first) |
| Candidates by skill/topic/school/project fit (recruitment) | `recruitment_find_candidates` (exhaustive filter, not top-k) |
| Who on staff works on a topic (not "which papers") | `kb_experts` |
| What the institute already has that overlaps a new idea (novelty check) | `kb_internal_overlap` |
| Answer from / cite paper content | `paper_search(mode='search')` |
| Which papers exist about a topic (broad recall, not content) | `paper_search(mode='find')` |
| Navigate the concept graph (method/task/dataset/metric neighbourhoods) | `paper_search(mode='explore')` |
| Paper counts by year/venue/tag, list papers by catalogue metadata, filter values | `paper_stats` |
| Read a paper's full text / structure | `paper_read` |
| Numeric benchmark results across papers | `paper_benchmarks` |
| Candidate research ideas grounded in the corpus | `research_ideas` |

## Multi-part questions (several numbers in one question)

1. Before any call, list the parts the owner asked for (for example: projects, open risks, open tasks,
   milestones, budget). Keep the list; every part gets an answer.
2. If the question is about one lab, project, report week or campaign, call `kb_overview` first. Take every
   part it covers from that one result. Call `kb_stats` / `kb_query` only for a part it does not cover.
3. Answer as a short table, one row per part: the number exactly as the tool returned it, and the `ref`
   (or the record name) it came from. Never add numbers up yourself and never recount a list.
4. A part with no data gets its own row saying so ("no budget recorded"), never a silent gap.
5. *Check:* the table has as many rows as the parts you listed in step 1.

`kb_overview` returns `found: false` with `candidates` when several records match the name: ask which one.
Without `candidates` the record does not exist: say so, do not guess a near match.

## Data gotchas (verified against the graph, not guesses)

These are institute-specific facts a generic schema read won't tell you. Get them wrong and the
arithmetic is *exactly* as wrong as not using `kb_query` at all, just more confidently so.

- **`organization.project_members.role = 'project_manager'` is nominal oversight, not workload.**
  Real contributor roles (`researcher`, `ai_engineer`, `software_developer`, `principal_scientist`,
  `principal_investigator`, `technical_lead`) carry meaningful `effort_percent`; `project_manager`
  rows are frequently 1-5% stakes spread across dozens of projects for administrative tracking.
  Any "workload / utilization / overallocated" question must `WHERE pm.role <> 'project_manager'`
  before summing `effort_percent`, or you will flag people who are barely involved and miss the
  people who are actually overloaded. Confirmed case: naive sum-all-roles flagged 2 false
  positives (100%+ purely from nominal PM stakes) and missed the actual highest person (225% in
  real contributor roles).
- **`organization.projects.status` means two different things depending on `type`.**
  `type='delivery'` → `status` is an execution state (`active`, `pilot`, ...). `type='research'`
  → `status` is a *paper-writing pipeline stage* (`ideation` → `experimentation` →
  `submission` → `rejected_resubmit` → `writing_communication` → `research_analysis` →
  `dissemination_impact` → `accepted`), not a work-in-progress/done signal. Never filter
  "active projects" across both types with one `status` value set — check `type` first.
- **Scalar columns from Postgres (incl. ones inside what looks like a nested object, e.g.
  `effort_percent`, `role`, `participation_status` on `ProjectMember`) are auto-promoted to real,
  typed, directly queryable Neo4j properties** (`app/kb/graph_props.py`: every column of every
  synced table gets this, inferred per column). If a property looks like it "must" be unreachable
  because the row also carries a `data` JSON blob — it almost certainly isn't; check `kb_schema(label)`
  or just try the property name in `kb_query`/`kb_stats` before assuming you need to parse JSON text.
- **Relationships are stored twice**: once as a generic `REF` and once as a typed name (`USER`,
  `PROJECT`, `PIC`, `OWNER`, `MEMBER`, `LAST_UPDATED_BY`, ...) for the same edge. Count or match on
  the **typed** relationship only (`-[:USER]->`), never `REF`, or every count doubles.
- **"Staff", "BOD" and "director" are not the same as "every `Person`".** A `Person` is every non-deleted
  user (83 on prod). The institute's *staff* (what the portal shows as "Total staffs", 64) excludes the board
  and the project business owners. Each `Person` carries `staffGroup` = `staff` | `bod` |
  `project_business_owner` (BOD wins). So:
  - "How many staff / nhân sự" → `kb_stats(label='Person', group_by='staffGroup')` in one call. Answer with the
    `staff` count, and add one line with the board and project-business-owner counts and the total, so every likely
    reading of "how many people" is covered without a second question.
  - "Active" staff, or a figure that does not match an earlier one → check `kb_schema(label='Person', find='active')`
    (or `status`) and count by that field in the same turn. Say which definition the number uses: a `Person` is a
    non-deleted user, which is not the same as an active one.
  - "Who is the director / giám đốc" → a director is a **role**, never a `job_title`. Read it from
    `UserRole` → `Role.name`: `qaci_director` = director of QACI as a whole; `lab_director` = head of one lab
    (each lab's one leader is `organizations.leader_id`); `office_director` = head of an office;
    `executive_board` = board. `Person.job_title` is free text (it may even hold a typo such as "Giám đóc")
    and does not make someone a director: a project business owner whose title says "Giám đốc" is not a
    lab director.
  - Answer leadership questions with **one** `kb_query` that returns, for every holder of those four roles: name,
    role, the lab or office it applies to, `staffGroup` and `job_title` (check the role-name property with
    `kb_schema(label='Role')` first). Then answer what was asked (the institute director) and mention the other
    leadership roles in one line. Any person named in the question, or named in an earlier answer, goes into that
    same query, so you can say what role they actually hold instead of "not checked".
  - **The institute director (Giám đốc viện QACI) is Phong Nguyen Xuan, whose login is `phongnx1`.** This is the
    institute's own convention and the data does not encode it (several people hold `qaci_director`, and all of them
    are on the board), so state it as fact and find the person by the email local part `phongnx1`, never by name or by
    job title. Answer "ai là giám đốc" with him alone. The other holders of `qaci_director` are mentioned in one short
    line only when the owner asks about the leadership as a whole ("Vai trò giám đốc cũng được gán cho …"); never present
    them as the institute director. A lab's head is the lab's leader (`leader_id` of the organization), not the
    institute director. If no `Person` with that login exists, say the director's record was not found instead of
    picking another holder.
  - If `staffGroup` is missing on a `Person` (the graph was not synced since it was added), say the staff
    figure could not be computed rather than falling back to counting every `Person`.
- **`kb_search` / `paper_search` hits carry a `score`** (RRF fusion of vector + fulltext, or Cohere
  rerank for papers). Use it as a real confidence signal — a low score across all hits is a reason
  to say so or abstain, not to answer as if the match were solid. It is not something to add to a
  tool's output; it is already there.
- **A record not surfaced by `kb_search` does not mean the data doesn't exist.** `kb_search` is
  ranked top-k text/vector match; it can miss an exact match that a structured `kb_query` would
  find instantly (e.g. a project whose name contains a term that didn't rank highly). Before
  answering `NOT_IN_DATA`, consider whether a `kb_query`/`kb_stats` over the right label — not
  another `kb_search` rephrase — is the more exhaustive check.

## Worked example: "who is overallocated"

Wrong way (what produced a wrong answer in practice): run a couple of `kb_search`/`kb_query` calls
that happen to surface some people, eyeball their project lists, guess.

Right way:
1. `kb_schema(label="ProjectMember")` (or `find="effort"`) once, to confirm `effort_percent`,
   `role`, `participation_status` are real properties.
2. One `kb_query`:
   ```cypher
   MATCH (pm:Rec {table:'organization.project_members'})-[:USER]->(u:Rec)
   WHERE pm.participation_status = 'active' AND pm.role <> 'project_manager'
   WITH u.full_name AS name, sum(pm.effort_percent) AS total, count(pm) AS n
   WHERE total > 100
   RETURN name, total, n ORDER BY total DESC
   ```
3. Answer with exactly the people returned and their total effort, in plain words, adding that nominal
   project-manager stakes are not counted. Keep the refs for a follow-up question about the source; never
   answer from a hand-tallied impression of search snippets.

## Tool-call budget

Interactive sessions cap tool calls (commonly 12). Spend them like this: `kb_schema` once near the
start of a conversation (reuse what you learned for later questions), then go straight to
`kb_query`/`kb_stats` for the actual answer rather than iterating `kb_search` rephrasings hoping for
a better hit.
