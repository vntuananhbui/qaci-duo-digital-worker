---
name: qaci-kb-search
title: Answer questions from the QACI knowledge base
description: Answer questions about institute staff, projects, risks, reports, recruitment and papers through the QACI knowledge base MCP, picking the right kb_* or paper_* tool for the question and avoiding the data gotchas that silently produce wrong counts.
triggers: knowledge base, institute data, how many staff, who is the director, overallocated, workload, project members, project status, recruitment candidates, find candidates, who works on, internal overlap, institute papers, paper benchmarks, research ideas
tags: knowledge-base, institute, neo4j, cypher, papers, recruitment
license: Unspecified
author: QACI Duo
---

# Answer questions from the QACI knowledge base

The QACI knowledge base MCP (`/qaci-gov-data/mcp`) answers questions over a Neo4j copy of the institute's data
(organisation, projects, recruitment) and the paper catalogue. It is synced periodically; every result carries
`lastSync`. It has 13 tools in two families: **kb_\*** and `recruitment_find_candidates` for institute data, and
**paper_\*** and `research_ideas` for papers. Each tool's own docstring is detailed: read it before first use. This
skill adds the two things a docstring cannot carry: which tool to reach for across a whole question, and the
institute-specific data quirks that look like bugs if you do not know them.

## When to use

- Questions about institute staff, roles, projects, workload, risks, reports, recruitment or the paper catalogue.
- Checking what the institute already has that overlaps a new research idea, or who on staff works on a topic.
- **Not for:** searching the open literature outside the institute's catalogue (use `survey-literature` /
  `find-papers`), or changing any institute data (the MCP is read-only).

## Inputs

| Input | Required | Default |
|---|---|---|
| The question, in the owner's words | yes | — |
| Scope: lab, project type (`delivery` / `research`), time range | no | the whole institute, current data |
| Whether test/demo records count | no | no: placeholder records stay hidden |

## Before you start: tool access

The tools come from the knowledge base MCP connection. If no `kb_*` or `paper_*` tool is available in your turn,
tell the owner in one sentence that the knowledge base connection must be added and enabled for this bot, then
stop. Never answer an institute question from memory.

## Procedure

1. **Classify the question shape** and pick the tool from the table below.
   *Check:* is it a count, sum, average, top-N, "most/least" or threshold ("over 100%")? Then it is a `kb_stats` or
   `kb_query` question, never a search question.
2. **Load the schema once.** Before the first `kb_query` in a conversation, call `kb_schema` (use `find=` to check
   whether a business term, Vietnamese or English, maps to a field before deciding it does not exist). Reuse what
   you learned for later questions.
3. **Answer over the whole table.** Use `kb_stats` for one-label aggregations and `kb_query` (read-only Cypher)
   for joins and exact filtered lists. Apply every gotcha below that touches the labels you use.
   *Check:* never add up `kb_search` / `paper_search` hits yourself: search ranks and cuts off, so a hand count over
   a partial list is wrong with high apparent confidence.
4. **Close every open end before answering.** If your answer would say "I did not check X" and X is one more
   `kb_query` away (another role of the same person, an active/inactive split, the reason two figures differ), run
   that query now. Leave something open only when no tool can answer it, and then say what would.
5. **Before saying "not in the data"**, try a structured `kb_query` / `kb_stats` over the right label, not another
   `kb_search` rephrase.
6. **Write the answer for a person, not for a database** (see Output):
   - The answer itself first, in one plain sentence, in the owner's language.
   - Then a small table only when it adds something (a breakdown, several people).
   - Human labels, not codes: "Giám đốc viện (`qaci_director`)", "Ban lãnh đạo (`bod`)". Never show internal
     property names such as `col_name` or raw table names in the answer.
   - One short source line in plain words, then refs and `lastSync`.
   - When this conversation gave a different figure earlier, say once which figure is right and why (after checking
     it, step 4). Do not leave the difference unexplained, and do not dwell on it.

### Picking the tool

| Question shape | Tool |
|---|---|
| Find a record by name or meaning ("find project X", "who is Y", top-k by relevance) | `kb_search` |
| Read one record's full fields and its relationships | `kb_get` |
| What properties and relationships a label has; whether a business term has a field | `kb_schema` (once per conversation, before the first `kb_query`) |
| Count / max / min / avg / sum / distinct count / group-by over **one label** | `kb_stats`: cheaper than `kb_query` and cannot be miscounted by hand |
| Multi-hop join, exact filtered list, anything `kb_stats` cannot shape | `kb_query` (read-only Cypher; call `kb_schema` first) |
| Candidates by skill, topic, school or project fit | `recruitment_find_candidates` (exhaustive filter, not top-k) |
| Who on staff works on a topic (not "which papers") | `kb_experts` |
| What the institute already has that overlaps a new idea | `kb_internal_overlap` |
| Answer from, or cite, paper content | `paper_search(mode='search')` |
| Which papers exist about a topic (broad recall, not content) | `paper_search(mode='find')` |
| Navigate the concept graph (method, task, dataset, metric neighbourhoods) | `paper_search(mode='explore')` |
| Paper counts by year, venue or tag; list papers by catalogue metadata | `paper_stats` |
| Read a paper's full text or structure | `paper_read` |
| Numeric benchmark results across papers | `paper_benchmarks` |
| Candidate research ideas grounded in the corpus | `research_ideas` |

Placeholder records (`placeholder=true`: "test", "demo", "my-project-N"…) are hidden everywhere by default. Pass
`include_placeholders=true`, or query for `placeholder=true`, only when the question is about test data.

### Data gotchas (verified against the graph)

Get one of these wrong and the arithmetic is exactly as wrong as not using `kb_query` at all, only more confidently.

- **`project_members.role = 'project_manager'` is nominal oversight, not workload.** Contributor roles
  (`researcher`, `ai_engineer`, `software_developer`, `principal_scientist`, `principal_investigator`,
  `technical_lead`) carry meaningful `effort_percent`; `project_manager` rows are often 1–5% stakes spread across
  many projects for administrative tracking. Any workload, utilisation or "overallocated" question must filter
  `pm.role <> 'project_manager'` before summing `effort_percent`. Summing every role flags people who are barely
  involved and misses the people who are really overloaded.
- **`projects.status` means two different things depending on `type`.** For `type='delivery'` it is an execution
  state (`active`, `pilot`, …). For `type='research'` it is a paper-writing stage (`ideation` → `experimentation`
  → `submission` → `rejected_resubmit` → `writing_communication` → `research_analysis` → `dissemination_impact`
  → `accepted`), not a work-in-progress or done signal. Never filter "active projects" across both types with one
  set of `status` values: check `type` first.
- **Scalar columns are real, typed properties**, including ones that sit next to a `data` JSON blob (for example
  `effort_percent`, `role`, `participation_status` on a project member). Check `kb_schema(label)` or try the
  property in `kb_query` / `kb_stats` before assuming you must parse JSON text.
- **Every relationship is stored twice**: once as a generic `REF` and once as a typed name (`USER`, `PROJECT`,
  `PIC`, `OWNER`, `MEMBER`, `LAST_UPDATED_BY`, …). Match and count on the **typed** relationship only
  (`-[:USER]->`), never `REF`, or every count doubles.
- **"Staff", "board" and "director" are not "every `Person`".** A `Person` is every non-deleted user. The
  institute's staff count excludes the board and project business owners. Each `Person` carries `staffGroup` =
  `staff` | `bod` | `project_business_owner` (board wins).
  - "How many staff" → `kb_stats(label='Person', group_by='staffGroup')` in one call. Answer with the `staff` count,
    and add one line with the board and project-business-owner counts and the total, so every likely reading of
    "how many people" is covered without a second question.
  - "Active" staff, or a figure that does not match an earlier one → check `kb_schema(label='Person', find='active')`
    (or `status`) and count by that field in the same turn. Say which definition the number uses: a `Person` is a
    non-deleted user, which is not the same as an active one.
  - "Who is the director" → a director is a **role**, never a `job_title`. Read it from `UserRole` → `Role` (check the
    role-name property with `kb_schema(label='Role')`): `qaci_director` (the institute), `lab_director` (one lab;
    each lab's leader is `organizations.leader_id`), `office_director` (an office), `executive_board` (the board).
    `job_title` is free text and may contain typos; a title that says "director" does not make someone a director.
  - Answer leadership questions with **one** `kb_query` that returns, for every holder of those four roles: name,
    role, the lab or office it applies to, `staffGroup` and `job_title`. Then answer what was asked (the institute
    director) and mention the other leadership roles in one line. Any person named in the question, or named in an
    earlier answer, goes into that same query, so you can say what role they actually hold instead of "not checked".
  - When several people hold `qaci_director`, say plainly that the data gives this role to several people, list
    them, and add that the data cannot tell which one is the head of the institute; suggest confirming with the
    portal administrator. Do not pick one.
  - If `staffGroup` is missing (the graph has not been synced since it was added), say the staff figure cannot be
    computed rather than counting every `Person`.
- **Search hits carry a `score`** (fusion of vector and full-text match, or a rerank score for papers). A low score
  across all hits is a reason to say so or abstain, not to answer as if the match were solid.

## Output

```markdown
<The answer in one plain sentence, in the owner's language.>

| <human column names> |                    ← only when a breakdown or several people help; exactly the rows returned
<One line on what is and is not included, e.g. "Không gồm <B> thành viên ban lãnh đạo và <P> project business owner; tổng <T> người.">
Nguồn: <plain words, e.g. "đếm theo nhóm nhân sự trong dữ liệu viện"> · dữ liệu lúc <lastSync> · ref: <ids>
```

Example of the tone (staff question): "QACI hiện có **<S> nhân viên** (không gồm <B> thành viên ban lãnh đạo và <P>
project business owner; tổng cộng <T> người trong hệ thống)."

## Quality checklist

- [ ] Every count, sum, top-N or threshold came from `kb_stats` or `kb_query` over the whole label, not from search hits.
- [ ] `kb_schema` was read before the first `kb_query` in the conversation.
- [ ] Workload questions exclude `project_manager` rows; status filters check `type` first; counts use typed relationships.
- [ ] Staff and director questions use `staffGroup` and roles, not every `Person` or `job_title`.
- [ ] The answer cites `ref`s and `lastSync`, and states every filter applied.
- [ ] The first sentence answers the question; role and group codes are shown with human labels; no internal property names.
- [ ] No "not checked" that one more query could have answered; any difference from an earlier figure is explained once.

## Guardrails

**Never**
- Compute a count, sum, top-k or threshold by adding up search results.
- Answer an institute question from memory, or say "not in the data" after only rephrased searches.
- Count on `REF` relationships, or treat a `job_title` as a role.
- Share personal data from the knowledge base beyond what the question needs, or outside the conversation it was asked in.

**Ask first**
- Including placeholder or test records.
- Questions about one named person's workload, evaluation or recruitment status when the owner's role or purpose is unclear.

## Example

**Request:** "Who is overallocated right now?"

**Wrong way:** a few `kb_search` calls that happen to surface some people, eyeballing their project lists, guessing.

**Right way:**
1. `kb_schema(label="ProjectMember")` (or `find="effort"`) once, to confirm `effort_percent`, `role` and
   `participation_status` are real properties.
2. One `kb_query`:
   ```cypher
   MATCH (pm:Rec {table:'organization.project_members'})-[:USER]->(u:Rec)
   WHERE pm.participation_status = 'active' AND pm.role <> 'project_manager'
   WITH u.full_name AS name, sum(pm.effort_percent) AS total, count(pm) AS n
   WHERE total > 100
   RETURN name, total, n ORDER BY total DESC
   ```
3. Report exactly the rows returned, with `ref`s and `lastSync`, and note that project-manager stakes are excluded.

**Request:** "Ai là giám đốc viện QACI?" (and an earlier answer in the chat named someone by job title)

**Right way:** one `kb_query` over the four leadership roles that also includes the person named earlier, returning
name, role, lab or office, `staffGroup` and `job_title`. Answer: the holders of "Giám đốc viện (`qaci_director`)"; if
there are several, say the data gives the role to several people and suggest confirming with the portal
administrator; one line on lab and office directors; and what role the earlier-named person actually holds, as a
fact, not "not checked".

**Tool-call budget:** interactive sessions often cap tool calls (commonly 12). Spend one on `kb_schema` near the
start, then go straight to `kb_stats` / `kb_query` for the answer instead of iterating search rephrasings.
