// A Digital Worker is a folder of plain files:
//
//   workers/<id>/worker.yaml      configuration (identity, release, apps, playbooks, skills, agents, rooms, routines…)
//   workers/<id>/BRIEF.md         given verbatim to every agent of the worker (the package's team.brief, which QACI
//                                 Duo injects into each bot's system prompt as its section context). It must have the
//                                 sections ## Mission, ## Working rules and ## Completion rule.
//   workers/<id>/souls/<key>.md   the standing system prompt of agent <key> (agents[].soul); souls/<id>.md is the
//                                 worker's own agent (the top-level soul)
//
// assembleWorker() turns those files into the single "frontmatter + body" document the rest of scripts/lib.mjs
// validates and builds packages from, so the package format is defined in one place. splitWorker() is the inverse,
// used to migrate a single-file worker and by scripts/import-from-qaci-duo.mjs.
import { parse as parseYaml, parseDocument, stringify as stringifyYaml } from "yaml";
import { WORKER_SECTIONS, section } from "./lib.mjs";

export const WORKER_YAML = "worker.yaml";
export const BRIEF_FILE = "BRIEF.md";
const INLINE_ONLY_IN_FILES = { teamBrief: "BRIEF.md", soul: "souls/<key>.md" };

/** One trailing newline in a file is formatting, not content. */
const fileText = (text) => text.replace(/\r\n/g, "\n").replace(/\n$/, "");

/**
 * The single-document form of a worker folder: { markdown, errors }. `souls` maps an agent key to its soul file's
 * text. `markdown` is null when the files cannot be combined.
 */
export function assembleWorker({ yaml, brief, souls = {} }) {
  const errors = [];
  let config;
  try {
    config = parseYaml(yaml);
  } catch (error) {
    return { markdown: null, errors: [`${WORKER_YAML} cannot be read: ${String(error.message).split("\n")[0]}`] };
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) return { markdown: null, errors: [`${WORKER_YAML} must be a mapping`] };
  if ("teamBrief" in config) errors.push(`${WORKER_YAML}: teamBrief is not set here; write it in ${INLINE_ONLY_IN_FILES.teamBrief}`);
  if ("soul" in config) errors.push(`${WORKER_YAML}: soul is not set here; write each agent's soul in ${INLINE_ONLY_IN_FILES.soul}`);
  const agents = Array.isArray(config.agents) ? config.agents : [];
  for (const [index, agent] of agents.entries()) {
    if (agent && typeof agent === "object" && "soul" in agent) errors.push(`${WORKER_YAML}: agents[${index}].soul is not set here; write it in souls/${agent.key ?? "<key>"}.md`);
  }
  const keys = new Set([config.id, ...agents.map((agent) => agent?.key)]);
  for (const key of Object.keys(souls)) if (!keys.has(key)) errors.push(`souls/${key}.md: neither the worker id nor any agent key in ${WORKER_YAML} is "${key}"`);
  if (typeof brief !== "string") errors.push(`${BRIEF_FILE} is missing: every worker needs the instructions all its agents share`);
  if (errors.length) return { markdown: null, errors };

  const text = fileText(brief);
  for (const heading of WORKER_SECTIONS) {
    if (!section(text, heading)) errors.push(`${BRIEF_FILE} is missing a non-empty \`## ${heading}\` section`);
  }
  if (errors.length) return { markdown: null, errors };

  const combined = {
    ...config,
    ...(souls[config.id] !== undefined ? { soul: fileText(souls[config.id]) } : {}),
    ...(config.agents ? { agents: agents.map((agent) => (souls[agent.key] !== undefined ? { ...agent, soul: fileText(souls[agent.key]) } : agent)) } : {}),
    teamBrief: text,
  };
  const body = WORKER_SECTIONS.map((heading) => `## ${heading}\n\n${section(text, heading)}\n`).join("\n");
  return { markdown: `---\n${stringifyYaml(combined, { lineWidth: 0 })}---\n\n# ${config.name ?? config.id ?? ""}\n\n${body}`, errors: [] };
}

/**
 * The folder form of a single-document worker: { yaml, brief, souls }. The YAML keeps its comments and order; the
 * brief is the old teamBrief followed by the body's ## Mission, ## Working rules and ## Completion rule sections, so
 * every agent now receives them.
 */
export function splitWorker(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error("the YAML frontmatter between two --- lines is missing at the top of the file");
  const doc = parseDocument(match[1]);
  const config = doc.toJS();
  const body = markdown.slice(match[0].length);
  const souls = {};
  if (typeof config.soul === "string") {
    souls[config.id] = `${config.soul.replace(/\n+$/, "")}\n`;
    doc.delete("soul");
  }
  (config.agents ?? []).forEach((agent, index) => {
    if (typeof agent?.soul === "string") {
      souls[agent.key] = `${agent.soul.replace(/\n+$/, "")}\n`;
      doc.deleteIn(["agents", index, "soul"]);
    }
  });
  doc.delete("teamBrief");
  const parts = [];
  const teamBrief = typeof config.teamBrief === "string" ? config.teamBrief.trim() : "";
  if (teamBrief) parts.push(teamBrief);
  // A brief that already carries the sections (a worker assembled from a folder) is the whole brief.
  if (WORKER_SECTIONS.every((heading) => section(teamBrief, heading))) return { yaml: doc.toString({ lineWidth: 0 }), brief: `${teamBrief}\n`, souls };
  for (const heading of WORKER_SECTIONS) {
    const text = section(body, heading);
    if (text) parts.push(`## ${heading}\n\n${text}`);
  }
  return { yaml: doc.toString({ lineWidth: 0 }), brief: `${parts.join("\n\n")}\n`, souls };
}
