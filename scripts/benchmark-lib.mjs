// Skill benchmarks: the rules for skills/<name>/benchmark.yml (the cases), benchmarks/<name>/<env>.json (what a
// QACI Duo answered on those cases, bound to the exact SKILL.md and benchmark.yml it ran with), and the scoring of
// the LLM judge's verdicts. Pure functions only; scripts/benchmark.mjs does the I/O.
import { createHash } from "node:crypto";
import { parse as parseYaml } from "yaml";

export const RUN_FORMAT = "qaci-duo.benchmark-run";
export const RUN_VERSION = 1;
export const ENVIRONMENTS = ["local", "dev"];
export const MIN_CASES = 3;
export const MAX_CASES = 10;
export const MAX_CRITERIA = 10;
export const MIN_THRESHOLD = 0.6;
export const MAX_OUTPUT_CHARS = 60_000;

const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** skills/<name>/benchmark.yml. Returns { benchmark, errors }; `benchmark` is null when it cannot be used. */
export function parseBenchmark(raw) {
  const errors = [];
  let doc;
  try {
    doc = parseYaml(raw);
  } catch (error) {
    return { benchmark: null, errors: [`cannot be read as YAML: ${String(error.message).split("\n")[0]}`] };
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return { benchmark: null, errors: ["must be a YAML mapping"] };
  for (const key of Object.keys(doc)) if (!["threshold", "cases"].includes(key)) errors.push(`unknown field "${key}"`);
  const threshold = doc.threshold;
  if (typeof threshold !== "number" || threshold < MIN_THRESHOLD || threshold > 1) {
    errors.push(`threshold must be a number from ${MIN_THRESHOLD} to 1 (the share of criteria that must pass)`);
  }
  const cases = Array.isArray(doc.cases) ? doc.cases : [];
  if (cases.length < MIN_CASES || cases.length > MAX_CASES) errors.push(`cases must list ${MIN_CASES}-${MAX_CASES} cases`);
  const ids = new Set();
  let triggerMiss = 0;
  cases.forEach((item, index) => {
    const at = `cases[${index}]`;
    if (!item || typeof item !== "object" || Array.isArray(item)) return errors.push(`${at} must be a mapping`);
    for (const key of Object.keys(item)) if (!["id", "input", "matchesTrigger", "criteria"].includes(key)) errors.push(`${at}: unknown field "${key}"`);
    if (typeof item.id !== "string" || !KEY.test(item.id)) errors.push(`${at}.id must use lowercase letters, digits and single hyphens`);
    else if (ids.has(item.id)) errors.push(`${at}.id "${item.id}" is listed twice`);
    else ids.add(item.id);
    if (typeof item.input !== "string" || item.input.trim().length < 10) errors.push(`${at}.input must be the real message sent to the worker (at least 10 characters)`);
    if (item.matchesTrigger !== undefined && typeof item.matchesTrigger !== "boolean") errors.push(`${at}.matchesTrigger must be true or false`);
    if (item.matchesTrigger === false) triggerMiss += 1;
    const criteria = Array.isArray(item.criteria) ? item.criteria : [];
    if (criteria.length < 1 || criteria.length > MAX_CRITERIA) errors.push(`${at}.criteria must list 1-${MAX_CRITERIA} checks`);
    let critical = 0;
    criteria.forEach((criterion, c) => {
      const cat = `${at}.criteria[${c}]`;
      if (!criterion || typeof criterion !== "object" || Array.isArray(criterion)) return errors.push(`${cat} must be a mapping with "check"`);
      for (const key of Object.keys(criterion)) if (!["check", "critical"].includes(key)) errors.push(`${cat}: unknown field "${key}"`);
      if (typeof criterion.check !== "string" || criterion.check.trim().length < 10) errors.push(`${cat}.check must say what a correct answer does (at least 10 characters)`);
      if (criterion.critical !== undefined && typeof criterion.critical !== "boolean") errors.push(`${cat}.critical must be true or false`);
      if (criterion.critical) critical += 1;
    });
    if (criteria.length && critical === 0) errors.push(`${at} needs at least one criterion with critical: true (what must never go wrong)`);
  });
  if (cases.length >= MIN_CASES && triggerMiss === 0) {
    errors.push("at least one case needs matchesTrigger: false (a request that misses every trigger, AGENTS.md \"Testing a change\")");
  }
  return { benchmark: errors.length ? null : { threshold, cases }, errors };
}

/** benchmarks/<skill>/<env>.json against the SKILL.md and benchmark.yml in this checkout. */
export function validateRun(run, { skill, env, skillRaw, benchmarkRaw, benchmark }) {
  const errors = [];
  if (!run || typeof run !== "object" || Array.isArray(run)) return ["must be a JSON object"];
  if (run.format !== RUN_FORMAT || run.version !== RUN_VERSION) errors.push(`format must be "${RUN_FORMAT}", version ${RUN_VERSION}`);
  if (run.skill !== skill) errors.push(`skill must be "${skill}"`);
  if (run.env !== env) errors.push(`env must be "${env}" (the file name)`);
  if (run.skillSha256 !== sha256(skillRaw)) errors.push("skillSha256 does not match skills/<name>/SKILL.md: the skill changed after this run, so run the cases again");
  if (run.benchmarkSha256 !== sha256(benchmarkRaw)) errors.push("benchmarkSha256 does not match benchmark.yml: the cases changed after this run, so run them again");
  if (typeof run.ranAt !== "string" || Number.isNaN(Date.parse(run.ranAt))) errors.push("ranAt must be an ISO date");
  const duo = run.qaciDuo ?? {};
  if (typeof duo.url !== "string" || !/^https?:\/\//.test(duo.url)) errors.push("qaciDuo.url must be the QACI Duo the cases ran on");
  if (env === "dev" && !/^https:\/\//.test(duo.url ?? "")) errors.push("qaciDuo.url must be the https address of the dev environment");
  if (typeof duo.model !== "string" || !duo.model.trim()) errors.push("qaciDuo.model must name the model the worker ran on");
  const runs = Array.isArray(run.runs) ? run.runs : [];
  const byCase = new Map(runs.map((entry) => [entry?.case, entry]));
  if (byCase.size !== runs.length) errors.push("runs lists a case twice");
  for (const item of benchmark?.cases ?? []) {
    const entry = byCase.get(item.id);
    if (!entry) {
      errors.push(`runs has no answer for case "${item.id}"`);
      continue;
    }
    if (typeof entry.output !== "string" || !entry.output.trim()) errors.push(`runs["${item.id}"].output is empty: paste the worker's full answer`);
    else if (entry.output.length > MAX_OUTPUT_CHARS) errors.push(`runs["${item.id}"].output is over ${MAX_OUTPUT_CHARS} characters`);
    if (env === "dev" && (typeof entry.threadUrl !== "string" || !entry.threadUrl.startsWith(duo.url ?? "\0"))) {
      errors.push(`runs["${item.id}"].threadUrl must link the conversation on ${duo.url ?? "the dev environment"} so a reviewer can open it`);
    }
  }
  for (const id of byCase.keys()) if (!benchmark?.cases?.some((item) => item.id === id)) errors.push(`runs has an answer for "${id}", which is not a case in benchmark.yml`);
  return errors;
}

/** A blank run file for the contributor to fill in, already bound to this SKILL.md and benchmark.yml. */
export function blankRun({ skill, env, skillRaw, benchmarkRaw, benchmark }) {
  return {
    format: RUN_FORMAT,
    version: RUN_VERSION,
    skill,
    env,
    skillSha256: sha256(skillRaw),
    benchmarkSha256: sha256(benchmarkRaw),
    ranAt: new Date().toISOString(),
    qaciDuo: { url: env === "dev" ? "https://qaci-duo-dev.fpt-qaci.com" : "http://localhost:5173", model: "" },
    runs: benchmark.cases.map((item) => ({ case: item.id, threadUrl: "", output: "" })),
  };
}

const squash = (text) => text.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * One case's judged criteria. `judgements` holds one verdict list per independent judge run. A criterion passes only
 * when every run says PASS and each PASS quotes text that really is in the output; a quote that is not there, a
 * missing verdict, or runs that disagree make it fail as UNSURE (never a pass).
 */
export function scoreCase(item, output, judgements) {
  const haystack = squash(output);
  const criteria = item.criteria.map((criterion, index) => {
    const verdicts = judgements.map((list) => list.find((verdict) => verdict.index === index));
    const reasons = [];
    let result;
    if (verdicts.some((verdict) => !verdict)) {
      result = "UNSURE";
      reasons.push("a judge run gave no verdict");
    } else if (new Set(verdicts.map((verdict) => verdict.result)).size > 1) {
      result = "UNSURE";
      reasons.push("the judge runs disagree");
    } else {
      result = verdicts[0].result;
      for (const verdict of verdicts) {
        if (verdict.result === "PASS" && (!verdict.quote?.trim() || !haystack.includes(squash(verdict.quote)))) {
          result = "UNSURE";
          reasons.push("the PASS quote is not in the output");
          break;
        }
      }
    }
    return {
      index,
      check: criterion.check,
      critical: Boolean(criterion.critical),
      result,
      reason: reasons.join("; ") || verdicts[0]?.reason || "",
      quote: verdicts[0]?.quote ?? "",
    };
  });
  const passed = criteria.filter((criterion) => criterion.result === "PASS").length;
  const criticalFailed = criteria.filter((criterion) => criterion.critical && criterion.result !== "PASS");
  return { case: item.id, criteria, score: passed / criteria.length, criticalFailed: criticalFailed.length };
}

/** The skill passes when no critical criterion failed in any case and the mean case score reaches the threshold. */
export function scoreSkill(benchmark, cases) {
  const score = cases.reduce((sum, item) => sum + item.score, 0) / (cases.length || 1);
  const criticalFailed = cases.reduce((sum, item) => sum + item.criticalFailed, 0);
  return { score, threshold: benchmark.threshold, criticalFailed, pass: criticalFailed === 0 && score >= benchmark.threshold };
}
