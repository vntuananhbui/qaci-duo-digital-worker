import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { blankRun, parseBenchmark, scoreCase, scoreSkill, sha256, validateRun } from "../scripts/benchmark-lib.mjs";
import { disallowedFiles } from "../scripts/lib.mjs";

const template = readFileSync(new URL("../templates/skill/benchmark.yml", import.meta.url), "utf8");
const skillRaw = "---\nname: demo\n---\n# Demo\n";

test("the template benchmark is valid", () => {
  const { benchmark, errors } = parseBenchmark(template);
  assert.deepEqual(errors, []);
  assert.equal(benchmark.cases.length, 3);
});

test("refuses a benchmark without a trigger-miss case, a critical criterion, or enough cases", () => {
  const noMiss = template.replace(/^(\s+)matchesTrigger: false$/gm, "$1matchesTrigger: true");
  assert.match(parseBenchmark(noMiss).errors.join("\n"), /matchesTrigger: false/);
  const noCritical = template.replace(/\n\s+critical: true/g, "");
  assert.match(parseBenchmark(noCritical).errors.join("\n"), /critical: true/);
  assert.match(parseBenchmark("threshold: 0.8\ncases: []\n").errors.join("\n"), /3-10 cases/);
  assert.match(parseBenchmark("threshold: 0.2\ncases: []\n").errors.join("\n"), /threshold/);
  assert.match(parseBenchmark(`${template}\nscore: 1\n`).errors.join("\n"), /unknown field "score"/);
});

function filledRun(env, overrides = {}) {
  const { benchmark } = parseBenchmark(template);
  const run = blankRun({ skill: "demo", env, skillRaw, benchmarkRaw: template, benchmark });
  run.qaciDuo = { url: "https://qaci-duo-dev.fpt-qaci.com", model: "claude-sonnet-5-5" };
  run.runs = run.runs.map((entry) => ({ ...entry, output: `Answer for ${entry.case}.`, threadUrl: `https://qaci-duo-dev.fpt-qaci.com/t/${entry.case}` }));
  return { run: { ...run, ...overrides }, benchmark };
}

test("a filled run bound to the current files is valid", () => {
  const { run, benchmark } = filledRun("dev");
  assert.deepEqual(validateRun(run, { skill: "demo", env: "dev", skillRaw, benchmarkRaw: template, benchmark }), []);
});

test("a run becomes stale when SKILL.md or benchmark.yml changes after it", () => {
  const { run, benchmark } = filledRun("local");
  const errors = validateRun(run, { skill: "demo", env: "local", skillRaw: `${skillRaw}edited\n`, benchmarkRaw: `${template}# edited\n`, benchmark });
  assert.match(errors.join("\n"), /skillSha256 does not match/);
  assert.match(errors.join("\n"), /benchmarkSha256 does not match/);
});

test("a dev run needs a conversation link on the dev address for every case, and every answer", () => {
  const { run, benchmark } = filledRun("dev");
  run.runs[0].threadUrl = "";
  run.runs[1].output = " ";
  run.runs.pop();
  const errors = validateRun(run, { skill: "demo", env: "dev", skillRaw, benchmarkRaw: template, benchmark }).join("\n");
  assert.match(errors, /threadUrl must link/);
  assert.match(errors, /output is empty/);
  assert.match(errors, /no answer for case "needs-approval"/);
});

test("a criterion passes only when every judge run says PASS and quotes the answer", () => {
  const item = { id: "c", criteria: [{ check: "Asks before sending the email.", critical: true }, { check: "Gives the summary in chat." }] };
  const output = "Here is the summary.\nShall I send it to the team?";
  const agree = [
    [{ index: 0, result: "PASS", quote: "Shall I send it  to the team?", reason: "" }, { index: 1, result: "PASS", quote: "Here is the summary.", reason: "" }],
    [{ index: 0, result: "PASS", quote: "shall i send it to the team?", reason: "" }, { index: 1, result: "PASS", quote: "Here is the summary.", reason: "" }],
  ];
  assert.equal(scoreCase(item, output, agree).score, 1);

  const invented = structuredClone(agree);
  invented[0][1].quote = "I sent the email to everyone.";
  invented[1][1].quote = "I sent the email to everyone.";
  assert.equal(scoreCase(item, output, invented).criteria[1].result, "UNSURE");

  const disagree = structuredClone(agree);
  disagree[1][0].result = "FAIL";
  const scored = scoreCase(item, output, disagree);
  assert.equal(scored.criteria[0].result, "UNSURE");
  assert.equal(scored.criticalFailed, 1);

  assert.equal(scoreCase(item, output, [[]]).criteria[0].result, "UNSURE");
});

test("a skill fails on any critical failure even with a high average", () => {
  const benchmark = { threshold: 0.5 };
  assert.equal(scoreSkill(benchmark, [{ score: 1, criticalFailed: 0 }, { score: 0.9, criticalFailed: 1 }]).pass, false);
  assert.equal(scoreSkill(benchmark, [{ score: 1, criticalFailed: 0 }, { score: 0.5, criticalFailed: 0 }]).pass, true);
  assert.equal(scoreSkill({ threshold: 0.9 }, [{ score: 1, criticalFailed: 0 }, { score: 0.5, criticalFailed: 0 }]).pass, false);
});

test("the layout allows benchmark files only where they belong", () => {
  assert.deepEqual(disallowedFiles(["skills/a-b/benchmark.yml", "benchmarks/a-b/dev.json", "benchmarks/a-b/local.json", "templates/skill/benchmark.yml", "REVIEW_CHECKLIST.md"]), []);
  const bad = ["skills/a/benchmark.json", "benchmarks/a/prod.json", "benchmarks/a/b/dev.json", "skills/a/bench.yml"];
  assert.deepEqual(disallowedFiles(bad), bad);
  assert.equal(sha256("x").length, 64);
});
