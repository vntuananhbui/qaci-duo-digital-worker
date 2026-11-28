// Shared rules for QACI Duo Digital Workers and playbooks: parse, validate, scan for secrets and build the library.
// A playbook is one SKILL.md (one capability); a Digital Worker (workers/<id>/, assembled by scripts/worker-files.mjs) is one bot that carries playbooks
// and, optionally, full embedded skills, MCP connection slots, and per-agent souls (standing system prompts).
// The checks follow QACI Duo's own parsers (shared/skill-md.ts, shared/package-format.ts).
// The package shape (team{name,leader,brief}, connections[], skills.entries[], agent.soul) matches QACI Duo's own
// package v2 schema (shared/package-format.ts's packageDocumentSchema), not just the lighter v1 shape.
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export const REQUIRED_SECTIONS = ["Activation", "Mission", "Outcomes", "Connections", "Team", "Chief of Staff", "Completion rule"];
export const COLORS = new Set(["green", "blue", "red", "orange", "purple", "cyan", "pink", "yellow", "teal", "coral"]);
export const MAX_PACKAGE_BYTES = 1_000_000; // QACI Duo refuses larger playbook files
export const MAX_CATALOG_BYTES = 256_000;
export const PACKAGE_FORMAT = "qaci-duo.package";
export const PACKAGE_VERSION = 2; // QACI Duo package v2: team{name,leader,brief}, connections[], skills.entries[]
export const TEAM_FORMAT = "qaci-duo.team";
export const CATALOG_FORMAT = "qaci-duo.catalog";
export const ROUTINE_RUNTIMES = new Set(["duo", "cloud"]);
/** `runOn` as the QACI Duo app reads it: `duo` (where the bot already runs) is the app's `maus`. */
export const APP_ROUTINE_RUNTIME = { duo: "maus", cloud: "cloud" };
export const SOUL_MAX_BYTES = 24_000; // a standing system prompt's limit, same cap QACI Duo itself uses
export const TEAM_BRIEF_MAX_BYTES = 24_000;
export const MAX_CONNECTIONS = 20;
export const MAX_CONNECTION_VALUE_NAMES = 32;
const KEY = /^[a-z0-9][a-z0-9_-]*$/;
const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]{1,128}$/;
const CREDENTIAL_FIELD = /^(token|access[_-]?token|password|passwd|secret|client[_-]?secret|api[_-]?key|credentials?|private[_-]?key)$/i;

const text = (value, max) => typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
const list = (value, max) => Array.isArray(value) && value.length <= max;

/** The YAML frontmatter and the readable body of a playbook file. */
export function splitPackage(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error("the YAML frontmatter between two --- lines is missing at the top of the file");
  let metadata;
  try {
    metadata = parseYaml(match[1]);
  } catch (error) {
    throw new Error(`the YAML frontmatter cannot be read: ${error.message.split("\n")[0]}`);
  }
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) throw new Error("the YAML frontmatter must be a mapping");
  return { metadata, body: markdown.slice(match[0].length) };
}

function credentialFields(value, path, out) {
  if (Array.isArray(value)) value.forEach((item, index) => credentialFields(item, `${path}[${index}]`, out));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const at = path ? `${path}.${key}` : key;
      if (CREDENTIAL_FIELD.test(key)) out.push(at);
      credentialFields(child, at, out);
    }
  }
  return out;
}

/** Every reason an MCP connection slot would be unsafe or invalid; a slot never carries a secret value, only the
 * address and the names of the header values the installer will supply. */
/** A routine schedule, as QACI Duo's package schema (shared/package-format.ts) and its cron calculator
 * (shared/routine-schedule.ts) accept it: daily, once, or a five-field cron with a named IANA time zone. The app checks
 * a cron expression fully on import; this catches the mistakes that would make it refuse the whole package. */
function validateSchedule(schedule, at, fail) {
  if (schedule?.type === "daily") {
    const days = schedule.weekdays;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.time ?? "")) fail(`${at}.schedule.time must be HH:MM, for example "09:00"`);
    if (!Array.isArray(days) || days.length === 0 || days.length > 7 || days.some((day) => !Number.isInteger(day) || day < 0 || day > 6) || new Set(days).size !== days.length) {
      fail(`${at}.schedule.weekdays must be distinct numbers 0-6 (0 = Sunday)`);
    }
  } else if (schedule?.type === "cron") {
    if (Object.keys(schedule).some((key) => !["type", "expression", "timeZone"].includes(key))) {
      fail(`${at}.schedule: a cron schedule takes only type, expression and timeZone`);
    }
    const expression = typeof schedule.expression === "string" ? schedule.expression.trim().replace(/\s+/g, " ") : "";
    const fields = expression.split(" ");
    if (!expression || expression.length > 256 || fields.length !== 5 || expression.includes("@") || fields.some((field) => !/^[0-9A-Za-z*,/?#LW-]+$/.test(field))) {
      fail(`${at}.schedule.expression must be five cron fields: minute hour day-of-month month weekday, for example "0 8 * * 1"`);
    }
    const timeZone = typeof schedule.timeZone === "string" ? schedule.timeZone.trim() : "";
    let knownZone = timeZone === "UTC" || /^[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+)+$/.test(timeZone);
    if (knownZone) {
      try { new Intl.DateTimeFormat("en-US", { timeZone }).format(0); } catch { knownZone = false; }
    }
    if (!knownZone) fail(`${at}.schedule.timeZone must be a named IANA time zone such as "Asia/Ho_Chi_Minh" or "UTC"`);
  } else if (schedule?.type !== "once" || !Number.isInteger(schedule.at)) {
    fail(`${at}.schedule must be daily (time + weekdays), cron (expression + timeZone) or once (at)`);
  }
}

function validateConnection(connection, at, fail) {
  if (!text(connection?.key, 64) || !KEY.test(connection.key)) fail(`${at}.key is invalid`);
  if (!text(connection?.label, 100)) fail(`${at}.label is required`);
  if (!text(connection?.reason, 240)) fail(`${at}.reason is required`);
  const mcp = connection?.mcp;
  if (!mcp || !["http", "sse"].includes(mcp.transport)) fail(`${at}.mcp.transport must be http or sse`);
  if (!text(mcp?.url, 2_000) || !/^https:\/\/\S+$/.test(mcp.url) || mcp.url.includes("@")) {
    fail(`${at}.mcp.url must be an https address with no embedded credentials`);
  }
  const names = mcp?.valueNames;
  if (!list(names ?? [], MAX_CONNECTION_VALUE_NAMES) || (names ?? []).some((name) => !HEADER_NAME.test(name))) {
    fail(`${at}.mcp.valueNames must be at most ${MAX_CONNECTION_VALUE_NAMES} valid header names`);
  } else if (new Set((names ?? []).map((name) => name.toLowerCase())).size !== (names ?? []).length) {
    fail(`${at}.mcp.valueNames must not repeat a header`);
  }
}

/** Every reason a playbook file would not install safely in QACI Duo; empty when it is fine. */
export function validatePackage(markdown, slug) {
  const errors = [];
  const fail = (message) => errors.push(message);
  if (Buffer.byteLength(markdown) > MAX_PACKAGE_BYTES) return ["the file is larger than 1 MB"];
  if (!SLUG.test(slug)) fail(`the file name "${slug}.md" must use lowercase letters, digits and hyphens`);
  let pkg;
  let body;
  try {
    ({ metadata: pkg, body } = splitPackage(markdown));
  } catch (error) {
    return [...errors, error.message];
  }
  if (pkg.format !== PACKAGE_FORMAT || pkg.version !== PACKAGE_VERSION) {
    fail(`\`format: ${PACKAGE_FORMAT}\` and \`version: ${PACKAGE_VERSION}\` are required (QACI Duo package v${PACKAGE_VERSION})`);
  }
  for (const heading of REQUIRED_SECTIONS) {
    if (!new RegExp(`^## ${heading.replace(/ /g, "\\s+")}\\s*$`, "m").test(body)) fail(`the body is missing the \`## ${heading}\` section`);
  }
  for (const field of credentialFields(pkg, "", [])) fail(`the field \`${field}\` looks like a credential; a playbook never carries tokens or passwords`);

  if (pkg.id !== slug) fail(`id must match the file name: \`id: ${slug}\``);
  if (!text(pkg.name, 100)) fail("name is required (at most 100 characters)");
  if (!text(pkg.tagline, 160)) fail("tagline is required (at most 160 characters)");
  if (!text(pkg.summary, 2000)) fail("summary is required (at most 2000 characters)");
  if (!/^\d+\.\d+\.\d+$/.test(String(pkg.release ?? ""))) fail("release must be a semantic version such as 1.0.0");
  if (!text(pkg.category, 80)) fail("category is required");
  if (!text(pkg.author?.name, 100)) fail("author.name is required");
  if (!text(pkg.license, 80)) fail("license is required");
  if (!list(pkg.outcomes, 12) || pkg.outcomes.length === 0 || pkg.outcomes.some((value) => !text(value, 240))) {
    fail("outcomes needs 1-12 lines of at most 240 characters");
  }
  if (!Number.isInteger(pkg.setupMinutes) || pkg.setupMinutes < 1 || pkg.setupMinutes > 240) fail("setupMinutes must be a whole number of minutes from 1 to 240");

  const requirements = pkg.requirements;
  if (!requirements || !list(requirements.apps ?? [], 30) || !list(requirements.capabilities ?? [], 20)) {
    fail("requirements is invalid (at most 30 apps and 20 capabilities)");
  }
  for (const [index, app] of (requirements?.apps ?? []).entries()) {
    if (!text(app?.slug, 80) || !KEY.test(app.slug) || !text(app?.label, 100) || !text(app?.reason, 240)) {
      fail(`requirements.apps[${index}] needs slug, label and reason`);
    }
  }

  if (!Array.isArray(pkg.agents) || pkg.agents.length === 0 || pkg.agents.length > 50) {
    fail("agents needs 1-50 entries");
    return errors;
  }

  const connectionKeys = new Set();
  if (!list(pkg.connections ?? [], MAX_CONNECTIONS)) fail(`connections allows at most ${MAX_CONNECTIONS} entries`);
  for (const [index, connection] of (pkg.connections ?? []).entries()) {
    const at = `connections[${index}]`;
    if (connectionKeys.has(connection?.key)) fail(`${at}.key is listed twice: ${connection.key}`);
    else connectionKeys.add(connection?.key);
    validateConnection(connection, at, fail);
  }

  const skillKeys = new Set();
  if (pkg.skills !== undefined) {
    if (pkg.skills?.version !== 1 || !list(pkg.skills?.entries, 60) || pkg.skills.entries.length === 0) {
      fail("skills.version must be 1 and skills.entries needs 1-60 entries");
    }
    for (const [index, skill] of (pkg.skills?.entries ?? []).entries()) {
      const at = `skills.entries[${index}]`;
      if (!text(skill?.name, 64) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill.name)) fail(`${at}.name is invalid`);
      else if (skillKeys.has(skill.name)) fail(`${at}.name is listed twice: ${skill.name}`);
      else skillKeys.add(skill.name);
      if (!text(skill?.description, 1_024)) fail(`${at}.description is required`);
      if (typeof skill?.instructions !== "string" || !/^---\r?\n/.test(skill.instructions) || Buffer.byteLength(skill.instructions) > 256 * 1024) {
        fail(`${at}.instructions must be a SKILL.md file (starts with frontmatter) under 256 KB`);
      } else {
        const front = readSkillFrontmatter(skill.instructions);
        const parsedDescription = front ? (parseYaml(front.yaml) ?? {}).description : undefined;
        if (typeof parsedDescription === "string" && parsedDescription.trim() !== skill.description) {
          fail(`${at}.description must match the embedded SKILL.md's own description`);
        }
      }
    }
  }

  const agentKeys = new Set();
  for (const [index, agent] of pkg.agents.entries()) {
    const at = `agents[${index}]`;
    if (!text(agent?.key, 64) || !KEY.test(agent.key)) fail(`${at}.key is invalid`);
    else if (agentKeys.has(agent.key)) fail(`${at}.key bị trùng: ${agent.key}`);
    else agentKeys.add(agent.key);
    if (!text(agent?.name, 100)) fail(`${at}.name is required`);
    if (typeof agent?.title !== "string" || agent.title.length > 200) fail(`${at}.title is required (at most 200 characters)`);
    if (typeof agent?.description !== "string" || agent.description.length > 4000) fail(`${at}.description is required (at most 4000 characters)`);
    if (!COLORS.has(agent?.appearance?.color)) fail(`${at}.appearance.color must be one of: ${[...COLORS].join(", ")}`);
    if (agent?.soul !== undefined && (typeof agent.soul !== "string" || Buffer.byteLength(agent.soul) > SOUL_MAX_BYTES)) {
      fail(`${at}.soul must be text under ${SOUL_MAX_BYTES} bytes`);
    }
    if (agent?.connections !== undefined && (!list(agent.connections, MAX_CONNECTIONS) || agent.connections.some((key) => !connectionKeys.has(key)))) {
      fail(`${at}.connections must name a declared connection`);
    }
  }
  if (pkg.team !== undefined) {
    if (!text(pkg.team?.name, 60)) fail("team.name is required (at most 60 characters)");
    if (pkg.team?.leader !== undefined && !agentKeys.has(pkg.team.leader)) fail(`team.leader "${pkg.team.leader}" is not an agent key`);
    if (pkg.team?.brief !== undefined && (typeof pkg.team.brief !== "string" || Buffer.byteLength(pkg.team.brief) > TEAM_BRIEF_MAX_BYTES)) {
      fail(`team.brief must be text under ${TEAM_BRIEF_MAX_BYTES} bytes`);
    }
  } else {
    fail("team is required whenever a package has agents");
  }
  if (pkg.examples !== undefined) {
    if (!list(pkg.examples, MAX_EXAMPLES)) fail(`examples allows at most ${MAX_EXAMPLES} entries`);
    for (const [index, example] of (pkg.examples ?? []).entries()) {
      const at = `examples[${index}]`;
      if (!text(example?.title, 120)) fail(`${at}.title is required (at most 120 characters)`);
      if (!text(example?.input, 4_000)) fail(`${at}.input is required (at most 4,000 characters)`);
      if (!text(example?.output, 8_000)) fail(`${at}.output is required (at most 8,000 characters)`);
    }
  }

  const playbookKeys = new Set();
  if (pkg.playbooks !== undefined) {
    if (!list(pkg.playbooks, 80) || pkg.playbooks.length === 0) fail("playbooks, when present, needs 1-80 entries");
    for (const [index, playbook] of pkg.playbooks.entries()) {
      const at = `playbooks[${index}]`;
      if (!text(playbook?.key, 64) || !KEY.test(playbook.key)) fail(`${at}.key is invalid`);
      else if (playbookKeys.has(playbook.key)) fail(`${at}.key bị trùng: ${playbook.key}`);
      else playbookKeys.add(playbook.key);
      if (!text(playbook?.name, 100) || !text(playbook?.summary, 300) || !text(playbook?.instructions, 24_000)) {
        fail(`${at} needs name, summary and instructions`);
      }
      if (!list(playbook?.triggers, 30) || playbook.triggers.length === 0 || playbook.triggers.some((value) => !text(value, 100))) {
        fail(`${at}.triggers needs 1-30 phrases`);
      }
    }
  }
  if (!playbookKeys.size && !skillKeys.size) fail("a package needs at least one playbook or skill across its agents");
  for (const agent of pkg.agents) {
    for (const key of agent?.playbooks ?? []) {
      if (!playbookKeys.has(key)) fail(`agent ${agent.key} uses playbook "${key}", which is not in playbooks`);
    }
    for (const key of agent?.skills ?? []) {
      if (!skillKeys.has(key)) fail(`agent ${agent.key} uses skill "${key}", which is not in skills.entries`);
    }
  }

  const roomKeys = new Set();
  if (!list(pkg.rooms ?? [], 30)) fail("rooms allows at most 30 entries");
  for (const [index, room] of (pkg.rooms ?? []).entries()) {
    const at = `rooms[${index}]`;
    if (!text(room?.key, 64) || roomKeys.has(room.key)) fail(`${at}.key is invalid or repeated`);
    else roomKeys.add(room.key);
    if (!text(room?.name, 100) || typeof room?.bulletin !== "string" || room.bulletin.length > 12_000) fail(`${at} needs name and bulletin`);
    if (!list(room?.members, 50) || room.members.length === 0 || room.members.some((key) => !agentKeys.has(key))) {
      fail(`${at}.members names an agent that does not exist`);
    }
    const responder = room?.defaultResponder;
    if (!responder || !["agent", "everyone", "mentions"].includes(responder.kind)) fail(`${at}.defaultResponder.kind must be agent, everyone or mentions`);
    else if (responder.kind === "agent" && !room.members?.includes(responder.agent)) fail(`${at}.defaultResponder must be a member of the room`);
  }

  const routineKeys = new Set();
  if (!list(pkg.routines ?? [], 50)) fail("routines allows at most 50 entries");
  for (const [index, routine] of (pkg.routines ?? []).entries()) {
    const at = `routines[${index}]`;
    if (!text(routine?.key, 64) || !KEY.test(routine.key) || routineKeys.has(routine.key)) fail(`${at}.key is invalid or repeated`);
    else routineKeys.add(routine.key);
    if (!text(routine?.name, 80) || !text(routine?.prompt, 20_000) || !agentKeys.has(routine?.agent)) fail(`${at} needs name, prompt and an existing agent`);
    if (routine?.enabledAfterInstall !== false) fail(`${at}: a routine must install switched off (\`enabledAfterInstall: false\`); its owner turns it on`);
    if (!ROUTINE_RUNTIMES.has(routine?.runOn)) fail(`${at}.runOn must be ${[...ROUTINE_RUNTIMES].join(" or ")}`);
    if (!Number.isInteger(routine?.durationMinutes) || routine.durationMinutes < 5 || routine.durationMinutes > 240) {
      fail(`${at}.durationMinutes must be from 5 to 240`);
    }
    validateSchedule(routine?.schedule, at, fail);
  }
  return errors;
}

const SECRET_PATTERNS = [
  ["a private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ["Anthropic/OpenAI key", /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{24,}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ["Azure key / connection string", /\b(?:AccountKey|SharedAccessKey)=[A-Za-z0-9+/=]{20,}/],
  ["a URL with a password in it", /\bhttps?:\/\/[^\s/:@]+:[^\s/@]+@/],
  ["an assigned password or token", /\b(?:password|passwd|pwd|token|api[_-]?key|secret|mat_?khau)\s*[:=]\s*["']?[A-Za-z0-9+/_\-.]{8,}/i],
];

/** Lines that look like a credential, as {line, label}. */
export function scanSecrets(content) {
  const hits = [];
  content.split(/\r?\n/).forEach((line, index) => {
    for (const [label, pattern] of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        hits.push({ line: index + 1, label });
        break;
      }
    }
  });
  return hits;
}


// ---------------------------------------------------------------------------------------------------------------
// Playbooks: skills/<name>/SKILL.md, one capability each. A worker can carry one as a lightweight "playbook"
// (trigger + instructions text only) or as a fully embedded "skill" (the whole SKILL.md file) — see readPlaybook.

export const PLAYBOOK_MAX_BYTES = 256 * 1024; // QACI Duo's SKILL.md limit
export const PLAYBOOK_BODY_MAX = 24_000; // a package playbook's instructions limit
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TAG = /^[a-z0-9][a-z0-9-]{0,23}$/;
const PLAYBOOK_FIELDS = new Set(["name", "title", "description", "triggers", "tags", "license", "author", "compatibility"]);
export const commaList = (value) => String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);

/** The `key: value` lines of a SKILL.md frontmatter, read as QACI Duo's Skills library reads them (one line each). */
export function readSkillFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  const fields = {};
  const stray = [];
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) stray.push(line);
    else fields[kv[1].toLowerCase()] = kv[2].trim();
  }
  return { fields, stray, yaml: match[1], body: match[2] ?? "" };
}

/** Every reason a playbook would not import into QACI Duo (as a bot skill or into the Skills library). */
export function validatePlaybook(raw, folder) {
  const errors = [];
  const fail = (message) => errors.push(message);
  if (Buffer.byteLength(raw) > PLAYBOOK_MAX_BYTES) return ["SKILL.md is larger than 256 KB"];
  if (!SKILL_NAME.test(folder) || folder.length > 64) fail(`the folder name "${folder}" must use lowercase letters, digits and single hyphens (at most 64 characters)`);
  const front = readSkillFrontmatter(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  if (!front) return [...errors, "the frontmatter between two --- lines is missing at the top of SKILL.md"];
  if (front.stray.length) fail("every frontmatter field must sit on one `key: value` line (QACI Duo does not read YAML lists or multi-line values)");
  let parsed;
  try {
    parsed = parseYaml(front.yaml) ?? {};
  } catch (error) {
    return [...errors, `the frontmatter is not valid YAML: ${error.message.split("\n")[0]}; put a value containing ": " in double quotes`];
  }
  for (const [key, value] of Object.entries(parsed)) {
    if (!PLAYBOOK_FIELDS.has(key)) fail(`the field \`${key}\` is not supported; use only: ${[...PLAYBOOK_FIELDS].join(", ")}`);
    else if (typeof value !== "string") fail(`\`${key}\` must be one line of text (separate list items with commas)`);
  }
  const field = (key) => (typeof parsed[key] === "string" ? parsed[key].trim() : "");
  if (field("name") !== folder) fail(`name must match the folder name: \`name: ${folder}\``);
  if (!text(field("title"), 100)) fail("title is required (the display name, at most 100 characters)");
  if (!text(field("description"), 300)) fail("description is required (one sentence, at most 300 characters)");
  const triggers = commaList(field("triggers"));
  if (triggers.length === 0 || triggers.length > 30 || triggers.some((trigger) => trigger.length > 100)) {
    fail("triggers needs 1-30 comma-separated phrases of at most 100 characters");
  }
  const tags = commaList(field("tags"));
  if (tags.length > 8 || tags.some((tag) => !TAG.test(tag))) fail("tags allows at most 8 lowercase comma-separated words");
  if (!text(field("license"), 200)) fail("license is required");
  if (!text(field("author"), 100)) fail("author is required");
  const body = front.body.trim();
  if (body.length < 100) fail("the body must describe the procedure (at least 100 characters)");
  // No per-file body cap here: a file this size is a valid SKILL.md either way (checked above, 256 KB). A worker
  // that carries it as a lightweight `playbooks:` entry is capped at PLAYBOOK_BODY_MAX there instead (validatePackage),
  // since that limit is specific to the real app's package.playbooks[].instructions field, not to `skills:` entries.
  // QACI Duo shows these to the reviewer as warnings; here they block the merge.
  if (/[A-Za-z0-9+/]{120,}={0,2}/.test(raw)) fail("contains a long base64-like string, a common way to hide instructions");
  if (/\b(curl|wget)\b[^\n]{0,200}\|\s*(ba|z|da)?sh\b/.test(raw)) fail("pipes a download straight into a shell (curl | sh)");
  if (/[​-‏‪-‮⁠-⁤﻿]/.test(raw.slice(1))) fail("contains invisible Unicode characters (zero-width or bidi controls)");
  return errors;
}

/** A valid playbook's fields, as the generated package (as a playbook or an embedded skill) and the catalog use them. */
export function readPlaybook(raw) {
  const front = readSkillFrontmatter(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  const meta = parseYaml(front.yaml);
  return {
    name: meta.name.trim(),
    title: meta.title.trim(),
    description: meta.description.trim(),
    triggers: commaList(meta.triggers),
    license: typeof meta.license === "string" ? meta.license.trim() : undefined,
    compatibility: typeof meta.compatibility === "string" ? meta.compatibility.trim() : undefined,
    body: front.body.trim(),
    raw,
  };
}

/** A playbook's file, as a fully embedded `skills.entries[]` item (the real SKILL.md text, not trigger+instructions). */
function skillEntry(playbook, source) {
  return {
    name: playbook.name,
    description: playbook.description,
    source,
    ...(playbook.license ? { license: playbook.license } : {}),
    ...(playbook.compatibility ? { compatibility: playbook.compatibility } : {}),
    instructions: playbook.raw,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Digital Workers: workers/<id>/ (assembled into one frontmatter + body document by scripts/worker-files.mjs), one bot each, carrying playbooks, embedded skills, connections and souls.

export const WORKER_SECTIONS = ["Mission", "Working rules", "Completion rule"];
const WORKER_FIELDS = new Set([
  "id", "release", "name", "title", "tagline", "description", "category", "author", "license", "tags", "color",
  "featured", "outcomes", "setupMinutes", "apps", "playbooks",
  // Optional multi-agent extension (backward compatible: a worker with none of these behaves exactly as before).
  "agents", "chiefOfStaff", "rooms", "routines",
  // Optional v2 extension: a full standing soul per agent, declared MCP connection slots, and whole embedded skills
  // (as opposed to the lightweight `playbooks` mechanism). All additive; see FORMAT.md.
  "soul", "connections", "skills", "teamBrief", "examples",
]);
export const MAX_EXAMPLES = 12;

/** The text under one `## heading` of a Markdown body. */
export function section(body, heading) {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^##\\s+${heading.replace(/ /g, "\\s+")}\\s*$`).test(line));
  if (start < 0) return "";
  const end = lines.findIndex((line, index) => index > start && /^##?\s/.test(line));
  return lines.slice(start + 1, end < 0 ? undefined : end).join("\n").trim();
}

/** Every reason a Digital Worker file would not install; `playbookNames` are the playbooks in the repository
 * (shared pool: a name may be used as a lightweight playbook, a fully embedded skill, or both). */
export function validateWorker(markdown, slug, playbookNames) {
  const errors = [];
  const fail = (message) => errors.push(message);
  if (!SLUG.test(slug)) fail(`the folder name "workers/${slug}/" must use lowercase letters, digits and hyphens`);
  let worker;
  let body;
  try {
    ({ metadata: worker, body } = splitPackage(markdown));
  } catch (error) {
    return [...errors, error.message];
  }
  for (const key of Object.keys(worker)) if (!WORKER_FIELDS.has(key)) fail(`the field \`${key}\` is not supported`);
  for (const at of credentialFields(worker, "", [])) fail(`the field \`${at}\` looks like a credential; a Digital Worker never carries tokens or passwords`);
  for (const heading of WORKER_SECTIONS) if (!section(body, heading)) fail(`the body is missing a non-empty \`## ${heading}\` section`);

  if (worker.id !== slug) fail(`id must match the file name: \`id: ${slug}\``);
  if (!/^\d+\.\d+\.\d+$/.test(String(worker.release ?? ""))) fail("release must be a semantic version such as 1.0.0");
  if (!text(worker.name, 100)) fail("name is required (at most 100 characters)");
  if (!text(worker.title, 200)) fail("title is required (the role, at most 200 characters)");
  if (!text(worker.tagline, 160)) fail("tagline is required (at most 160 characters)");
  if (!text(worker.description, 2000)) fail("description is required (what the worker does and does not do, at most 2000 characters)");
  if (!text(worker.category, 80)) fail("category is required");
  if (!text(worker.author?.name, 100)) fail("author.name is required");
  if (!text(worker.license, 80)) fail("license is required");
  if (worker.tags !== undefined && (!list(worker.tags, 30) || worker.tags.some((tag) => !text(tag, 80)))) fail("tags allows at most 30 entries");
  if (!COLORS.has(worker.color)) fail(`color must be one of: ${[...COLORS].join(", ")}`);
  if (worker.featured !== undefined && typeof worker.featured !== "boolean") fail("featured must be true or false");
  if (!list(worker.outcomes, 12) || worker.outcomes.length === 0 || worker.outcomes.some((value) => !text(value, 240))) {
    fail("outcomes needs 1-12 lines of at most 240 characters");
  }
  if (worker.setupMinutes !== undefined && (!Number.isInteger(worker.setupMinutes) || worker.setupMinutes < 1 || worker.setupMinutes > 240)) {
    fail("setupMinutes must be a whole number of minutes from 1 to 240");
  }
  if (worker.apps !== undefined && !list(worker.apps, 30)) fail("apps allows at most 30 entries");
  for (const [index, app] of (Array.isArray(worker.apps) ? worker.apps : []).entries()) {
    if (!text(app?.slug, 64) || !KEY.test(app.slug) || !text(app?.label, 100) || !text(app?.reason, 240)) fail(`apps[${index}] needs slug, label and reason`);
  }
  // `worker.soul` is this worker's own standing system prompt — it is the primary agent (id/name/title/description/
  // color above), the same way `agents[].soul` is a teammate's. A worker never gets its own `connections` subset
  // here: in practice a sensitive connection goes to a named specialist in `agents`, not the generic lead.
  if (worker.soul !== undefined && (typeof worker.soul !== "string" || Buffer.byteLength(worker.soul) > SOUL_MAX_BYTES)) {
    fail(`soul must be text under ${SOUL_MAX_BYTES} bytes`);
  }

  if (worker.playbooks !== undefined && (!list(worker.playbooks, 30) || worker.playbooks.length === 0)) fail("playbooks, when present, needs 1-30 entries");
  if (worker.skills !== undefined && (!list(worker.skills, 30) || worker.skills.length === 0)) fail("skills, when present, needs 1-30 entries");
  if ((worker.playbooks?.length ?? 0) + (worker.skills?.length ?? 0) === 0) fail("a worker needs at least one playbook or skill (playbooks: or skills:)");
  const seen = new Set();
  for (const name of [...(worker.playbooks ?? []), ...new Set(worker.skills ?? [])]) {
    if (!playbookNames.has(name)) fail(`"${name}" does not exist as workers/${slug}/skills/${name}/SKILL.md or skills/${name}/SKILL.md`);
  }
  for (const name of worker.playbooks ?? []) {
    if (seen.has(name)) fail(`playbook "${name}" is listed twice`);
    seen.add(name);
  }
  const seenSkills = new Set();
  for (const name of worker.skills ?? []) {
    if (seenSkills.has(name)) fail(`skill "${name}" is listed twice`);
    seenSkills.add(name);
  }
  const workerPlaybooks = new Set(Array.isArray(worker.playbooks) ? worker.playbooks : []);
  const workerSkills = new Set(Array.isArray(worker.skills) ? worker.skills : []);

  const connectionKeys = new Set();
  if (worker.connections !== undefined) {
    if (!list(worker.connections, MAX_CONNECTIONS)) fail(`connections allows at most ${MAX_CONNECTIONS} entries`);
    for (const [index, connection] of (Array.isArray(worker.connections) ? worker.connections : []).entries()) {
      const at = `connections[${index}]`;
      if (connectionKeys.has(connection?.key)) fail(`${at}.key is listed twice: ${connection.key}`);
      else connectionKeys.add(connection?.key);
      validateConnection(connection, at, fail);
    }
  }
  if (worker.teamBrief !== undefined && (typeof worker.teamBrief !== "string" || Buffer.byteLength(worker.teamBrief) > TEAM_BRIEF_MAX_BYTES)) {
    fail(`teamBrief must be text under ${TEAM_BRIEF_MAX_BYTES} bytes`);
  }
  if (worker.examples !== undefined) {
    if (!list(worker.examples, MAX_EXAMPLES)) fail(`examples allows at most ${MAX_EXAMPLES} entries`);
    for (const [index, example] of (Array.isArray(worker.examples) ? worker.examples : []).entries()) {
      const at = `examples[${index}]`;
      if (!text(example?.title, 120)) fail(`${at}.title is required (at most 120 characters)`);
      if (!text(example?.input, 4_000)) fail(`${at}.input is required (a realistic request, at most 4,000 characters)`);
      if (!text(example?.output, 8_000)) fail(`${at}.output is required (the expected response outline, at most 8,000 characters)`);
    }
  }

  // Optional multi-agent extension. A worker is always the primary agent `worker.id` (name/title/description/color
  // above); `agents` lists its teammates, `rooms` are shared chat rooms between them, and `routines` are scheduled
  // automations (always installed paused). A worker with none of these fields behaves exactly as before.
  const agentKeys = new Set([worker.id]);
  if (worker.agents !== undefined) {
    if (!list(worker.agents, 49)) fail("agents allows at most 49 teammates in addition to the worker itself (50 agents total)");
    for (const [index, agent] of (Array.isArray(worker.agents) ? worker.agents : []).entries()) {
      const at = `agents[${index}]`;
      if (!text(agent?.key, 64) || !KEY.test(agent.key) || agent.key === worker.id) fail(`${at}.key is invalid`);
      else if (agentKeys.has(agent.key)) fail(`${at}.key is listed twice: ${agent.key}`);
      else agentKeys.add(agent.key);
      if (!text(agent?.name, 100)) fail(`${at}.name is required`);
      if (typeof agent?.title !== "string" || agent.title.length > 200) fail(`${at}.title is required (at most 200 characters)`);
      if (typeof agent?.description !== "string" || agent.description.length > 4000) fail(`${at}.description is required (at most 4000 characters)`);
      if (!COLORS.has(agent?.color)) fail(`${at}.color must be one of: ${[...COLORS].join(", ")}`);
      if (agent?.soul !== undefined && (typeof agent.soul !== "string" || Buffer.byteLength(agent.soul) > SOUL_MAX_BYTES)) {
        fail(`${at}.soul must be text under ${SOUL_MAX_BYTES} bytes`);
      }
      if (agent?.playbooks !== undefined && (!list(agent.playbooks, 30) || agent.playbooks.some((name) => !workerPlaybooks.has(name)))) {
        fail(`${at}.playbooks must be a subset of this worker's own playbooks`);
      }
      if (agent?.skills !== undefined && (!list(agent.skills, 30) || agent.skills.some((name) => !workerSkills.has(name)))) {
        fail(`${at}.skills must be a subset of this worker's own skills`);
      }
      if (agent?.connections !== undefined && (!list(agent.connections, MAX_CONNECTIONS) || agent.connections.some((key) => !connectionKeys.has(key)))) {
        fail(`${at}.connections must name a key declared in this worker's own connections`);
      }
    }
  }
  if (worker.chiefOfStaff !== undefined && !agentKeys.has(worker.chiefOfStaff)) fail(`chiefOfStaff "${worker.chiefOfStaff}" is not an agent key`);

  if (worker.rooms !== undefined) {
    if (!list(worker.rooms, 30)) fail("rooms allows at most 30 entries");
    const roomKeys = new Set();
    for (const [index, room] of (Array.isArray(worker.rooms) ? worker.rooms : []).entries()) {
      const at = `rooms[${index}]`;
      if (!text(room?.key, 64) || roomKeys.has(room.key)) fail(`${at}.key is invalid or repeated`);
      else roomKeys.add(room.key);
      if (!text(room?.name, 100) || typeof room?.bulletin !== "string" || room.bulletin.length > 12_000) fail(`${at} needs name and bulletin`);
      if (!list(room?.members, 50) || room.members.length === 0 || room.members.some((key) => !agentKeys.has(key))) {
        fail(`${at}.members names an agent that does not exist`);
      }
      const responder = room?.defaultResponder;
      if (!responder || !["agent", "everyone", "mentions"].includes(responder.kind)) fail(`${at}.defaultResponder.kind must be agent, everyone or mentions`);
      else if (responder.kind === "agent" && !room.members?.includes(responder.agent)) fail(`${at}.defaultResponder must be a member of the room`);
    }
  }

  if (worker.routines !== undefined) {
    if (!list(worker.routines, 50)) fail("routines allows at most 50 entries");
    const routineKeys = new Set();
    for (const [index, routine] of (Array.isArray(worker.routines) ? worker.routines : []).entries()) {
      const at = `routines[${index}]`;
      if (!text(routine?.key, 64) || !KEY.test(routine.key) || routineKeys.has(routine.key)) fail(`${at}.key is invalid or repeated`);
      else routineKeys.add(routine.key);
      if (!text(routine?.name, 80) || !text(routine?.prompt, 20_000) || !agentKeys.has(routine?.agent)) fail(`${at} needs name, prompt and an existing agent`);
      if (routine?.enabledAfterInstall !== false) fail(`${at}: a routine must install switched off (\`enabledAfterInstall: false\`); its owner turns it on`);
      if (!ROUTINE_RUNTIMES.has(routine?.runOn)) fail(`${at}.runOn must be ${[...ROUTINE_RUNTIMES].join(" or ")}`);
      if (!Number.isInteger(routine?.durationMinutes) || routine.durationMinutes < 5 || routine.durationMinutes > 240) {
        fail(`${at}.durationMinutes must be from 5 to 240`);
      }
      validateSchedule(routine?.schedule, at, fail);
    }
  }

  return errors;
}

const yamlBlock = (value) => stringifyYaml(value, { lineWidth: 0 }).trimEnd();

// The real QACI Duo app's own package format (shared/package-format.ts's packageDocumentSchema): a flat
// `{format: "openmaus.package", version: 2, package: {...}}` envelope, nested — not the flat top-level shape
// this repository's own PACKAGE_FORMAT ("qaci-duo.package") uses for its .md files. The two are independent: a
// worker's generated packages/<id>.md (PACKAGE_FORMAT, for this repository's own catalog/team-library mechanism)
// and packages/<id>.json (REAL_PACKAGE_FORMAT, for the real app's Templates-style JSON import) both come from
// the same `packageFields()` below, just wrapped differently.
export const REAL_PACKAGE_FORMAT = "openmaus.package";
export const REAL_PACKAGE_VERSION = 2;

/** Everything a worker's generated package needs, independent of how it gets wrapped (this repository's own
 * flat `.md` shape vs. the real app's nested `{format, version, package}` JSON shape). */
function packageFields(worker, playbooksByName) {
  const playbookNames = worker.playbooks ?? [];
  const skillNames = worker.skills ?? [];
  const playbooks = playbookNames.map((name) => playbooksByName.get(name));
  const skills = skillNames.map((name) => playbooksByName.get(name));
  const apps = worker.apps ?? [];
  const connections = worker.connections ?? [];
  const extraAgents = worker.agents ?? [];
  const playbooksFor = (agent) => (agent?.playbooks?.length ? agent.playbooks : playbookNames.length ? playbookNames : undefined);
  const skillsFor = (agent) => (agent?.skills?.length ? agent.skills : skillNames.length ? skillNames : undefined);
  // Unlike playbooks/skills (every agent gets all of the worker's own by default), a connection is never handed to
  // an agent unless explicitly listed on *that agent*: most real teams give a sensitive connection to exactly one
  // teammate. The worker's own top-level entry never carries one — `worker.connections` is the pool of slots a
  // teammate may be given, not a key list of its own.
  const agent = (key, name, title, description, color, extra, connectionKeys) => ({
    key, name, title, description, appearance: { color },
    ...(playbooksFor(extra) ? { playbooks: playbooksFor(extra) } : {}),
    ...(skillsFor(extra) ? { skills: skillsFor(extra) } : {}),
    ...(extra?.soul ? { soul: extra.soul } : {}),
    ...(connectionKeys?.length ? { connections: connectionKeys } : {}),
  });
  // A worker whose own top-level fields are not the team's lead — it names a real teammate as chiefOfStaff
  // instead — doesn't need a bot of its own: id/name/title/description/color stay package metadata only (the
  // Templates card), and the real agents are exactly the ones it declares. Without this, every multi-agent
  // worker would always carry one extra, soul-less, roomless bot that does nothing but duplicate the package's
  // own name — which is exactly what showed up as an unexplained 5th "team member" once this was actually
  // installed. A worker with no `agents` (the common single-bot case) is unaffected: it is always its own agent.
  const ownFieldsAreTheLead = extraAgents.length === 0 || worker.chiefOfStaff === undefined || worker.chiefOfStaff === worker.id;
  const agents = [
    ...(ownFieldsAreTheLead ? [agent(worker.id, worker.name, worker.title, worker.description, worker.color, worker)] : []),
    ...extraAgents.map((extra) => agent(extra.key, extra.name, extra.title, extra.description, extra.color, extra, extra.connections)),
  ];
  const chiefOfStaff = worker.chiefOfStaff ?? worker.id;
  const rooms = (worker.rooms ?? []).map((room) => ({
    key: room.key, name: room.name, members: room.members, bulletin: room.bulletin, defaultResponder: room.defaultResponder,
  }));
  const routines = (worker.routines ?? []).map((routine) => ({
    key: routine.key, name: routine.name, agent: routine.agent, prompt: routine.prompt, runOn: routine.runOn,
    schedule: routine.schedule, durationMinutes: routine.durationMinutes, enabledAfterInstall: false,
  }));
  const pkg = {
    id: worker.id,
    release: String(worker.release),
    name: worker.name,
    tagline: worker.tagline,
    summary: worker.description,
    category: worker.category,
    author: worker.author,
    license: worker.license,
    ...(worker.featured === true ? { featured: true } : {}),
    ...(worker.tags ? { tags: worker.tags } : {}),
    outcomes: worker.outcomes,
    setupMinutes: worker.setupMinutes ?? 5,
    requirements: { apps, capabilities: [], platforms: ["any"] },
    team: { name: worker.name.slice(0, 60).trim(), leader: chiefOfStaff, ...(worker.teamBrief ? { brief: worker.teamBrief } : {}) },
    agents,
    ...(rooms.length ? { rooms } : {}),
    ...(routines.length ? { routines } : {}),
    ...(connections.length ? { connections } : {}),
    ...(playbooks.length ? {
      playbooks: playbooks.map((playbook) => ({
        key: playbook.name, name: playbook.title, summary: playbook.description, triggers: playbook.triggers, instructions: playbook.body,
      })),
    } : {}),
    ...(skills.length ? { skills: { version: 1, entries: skills.map((playbook) => skillEntry(playbook, worker.id)) } } : {}),
    ...(worker.examples?.length ? { examples: worker.examples } : {}),
  };
  return { pkg, agents, rooms, routines, playbooks, skills, connections, apps, chiefOfStaff };
}

/** The real QACI Duo app's own package v2 document — `{format: "openmaus.package", version: 2, package: {...}}`,
 * nested, matching shared/package-format.ts's packageDocumentSchema exactly. This is what the real app's
 * Templates-style JSON import (and docs/playbooks/*.json in qaci-duo) actually reads; confirmed by importing
 * one of these into a real, unmodified QACI Duo server — unlike packages/<id>.md below,
 * which this repository's own PACKAGE_FORMAT rename made unreadable by the real app's Markdown import path. */
export function workerRealPackage(markdown, playbooksByName) {
  const { metadata: worker } = splitPackage(markdown);
  const { pkg } = packageFields(worker, playbooksByName);
  // The app names "run where the bot already runs" `maus` (shared/package-format.ts: runOn "maus" | "cloud") and
  // refuses `duo`, so a routine written with this repository's `duo` would make the whole package fail to install.
  const routines = pkg.routines?.map((routine) => ({ ...routine, runOn: APP_ROUTINE_RUNTIME[routine.runOn] ?? routine.runOn }));
  return { format: REAL_PACKAGE_FORMAT, version: REAL_PACKAGE_VERSION, package: { ...pkg, ...(routines ? { routines } : {}) } };
}

/** The QACI Duo package v2 file this repository's own catalog/team-library mechanism uses: a worker is one or
 * more agents sharing the worker's playbooks, embedded skills and declared connections. See workerRealPackage()
 * for the shape the real app's own JSON import actually reads. */
export function workerPackage(markdown, playbooksByName) {
  const { metadata: worker, body } = splitPackage(markdown);
  const { pkg: fields, agents, rooms, routines, playbooks, skills, connections, apps, chiefOfStaff } = packageFields(worker, playbooksByName);
  const pkg = { format: PACKAGE_FORMAT, version: PACKAGE_VERSION, ...fields };
  const teamSection = agents.map((entry) => `- **${entry.name} — ${entry.title}.** ${entry.description}`).join("\n");
  const chiefName = agents.find((entry) => entry.key === chiefOfStaff)?.name ?? worker.name;
  const chiefOfStaffSection = agents.length > 1
    ? `\`${chiefOfStaff}\` (${chiefName}) is the Chief of Staff: it takes the request, delegates to the right teammate and returns one answer to the user.`
    : `\`${worker.id}\` (${worker.name}) is the only agent: it takes the request, picks the right playbook or skill and answers the user.`;
  const roomsSection = rooms.length
    ? ["", "## Shared rooms", "", ...rooms.map((room) =>
        `- **${room.name}** (\`${room.key}\`) — members: ${room.members.map((key) => `\`${key}\``).join(", ")}.${room.bulletin ? ` ${room.bulletin}` : ""}`)]
    : [];
  const routinesSection = routines.length
    ? ["", "## Suggested routines", "", ...routines.map((routine) =>
        `- **${routine.name}** (\`${routine.key}\`), owned by \`${routine.agent}\` — installs paused; its owner turns it on.`)]
    : [];
  const skillsSection = skills.length
    ? ["", "## Skills", "", ...skills.map((playbook) => `- **${playbook.title}** (\`${playbook.name}\`): ${playbook.description}`)]
    : [];
  const examplesSection = worker.examples?.length
    ? ["", "## Example job", "", ...worker.examples.flatMap((example) =>
        [`### ${example.title}`, "", "**Ask**", "", example.input, "", "**Expected result**", "", example.output, ""])]
    : [];
  return [
    "---",
    yamlBlock(pkg),
    "---",
    "",
    `# ${worker.name}`,
    "",
    worker.tagline,
    "",
    `> A QACI Duo Digital Worker, generated from \`workers/${worker.id}.md\` and \`skills/*/SKILL.md\`. Do not edit this file; open a pull request against \`main\`.`,
    "",
    "## Activation",
    "",
    section(body, "Working rules"),
    "",
    "## Mission",
    "",
    section(body, "Mission"),
    "",
    "## Outcomes",
    "",
    ...worker.outcomes.map((outcome) => `- ${outcome}`),
    "",
    "## Connections",
    "",
    ...(apps.length ? apps.map((app) => `- **${app.label}**${app.optional ? " (optional)" : ""}: ${app.reason}`) : []),
    ...(connections.length ? connections.map((connection) => `- **${connection.label}** (MCP): ${connection.reason}`) : []),
    ...(apps.length || connections.length ? [] : ["No app connections are needed."]),
    "",
    "## Team",
    "",
    teamSection,
    "",
    "## Chief of Staff",
    "",
    chiefOfStaffSection,
    ...roomsSection,
    ...routinesSection,
    "",
    "## Playbooks",
    "",
    ...(playbooks.length ? playbooks.map((playbook) => `- **${playbook.title}** (\`${playbook.name}\`): ${playbook.description}`) : ["None — this worker uses embedded skills only."]),
    ...skillsSection,
    ...examplesSection,
    "",
    "## Completion rule",
    "",
    section(body, "Completion rule"),
    "",
  ].join("\n");
}

const oneLine = (value, max) => {
  const line = String(value ?? "").replace(/\s+/g, " ").trim();
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line;
};

/** Everything the team-library catalog expects for one worker: package, team manifest, README, skills. */
export function workerLibraryFiles(markdown, playbooksByName) {
  const { metadata: worker } = splitPackage(markdown);
  const id = worker.id;
  const carried = [...new Set([...(worker.playbooks ?? []), ...(worker.skills ?? [])])].map((name) => playbooksByName.get(name));
  const extraAgents = worker.agents ?? [];
  // Mirrors packageFields()'s own rule: a worker that names a real teammate as chiefOfStaff isn't a member of its
  // own team — its id/name/etc. stay metadata only, not a 5th bot alongside the ones it actually declared.
  const ownFieldsAreTheLead = extraAgents.length === 0 || worker.chiefOfStaff === undefined || worker.chiefOfStaff === id;
  const members = [
    ...(ownFieldsAreTheLead ? [{ key: id, name: worker.name, title: worker.title, description: worker.description, appearance: { color: worker.color } }] : []),
    ...extraAgents.map((agent) => ({ key: agent.key, name: agent.name, title: agent.title, description: agent.description, appearance: { color: agent.color } })),
  ];
  const chiefOfStaff = worker.chiefOfStaff ?? id;
  const configuredRoom = (worker.rooms ?? [])[0];
  const room = configuredRoom
    ? {
        name: configuredRoom.name,
        bulletin: configuredRoom.bulletin,
        defaultResponder: configuredRoom.defaultResponder.kind === "agent"
          ? { kind: "member", member: configuredRoom.defaultResponder.agent }
          : { kind: configuredRoom.defaultResponder.kind },
      }
    : { name: worker.name, bulletin: "", defaultResponder: { kind: "member", member: chiefOfStaff } };
  const manifest = {
    format: TEAM_FORMAT,
    version: 1,
    team: { name: worker.name, description: oneLine(worker.tagline, 500), members, room },
  };
  const skills = carried.map((playbook) => ({ path: `teams/${id}/skills/${playbook.name}/SKILL.md`, content: playbook.raw }));
  const readme = [
    `# ${worker.name}`,
    "",
    `**${worker.title}.** ${worker.tagline}`,
    "",
    worker.description,
    "",
    "## Playbook",
    "",
    ...carried.map((playbook) => `- **${playbook.title}** — ${playbook.description} ([SKILL.md](../../skills/${playbook.name}/SKILL.md))`),
    "",
    `Source: \`workers/${id}.md\` on \`main\`.`,
    "",
  ].join("\n");
  const entry = {
    slug: id,
    name: worker.name,
    // The release QACI Duo compares with each installed Digital Worker's, to offer its in-place update.
    release: String(worker.release),
    summary: oneLine(worker.tagline, 300),
    category: worker.category,
    // No `outcome`: the Templates card then shows the summary, which is the worker's tagline.
    setupMinutes: worker.setupMinutes ?? 5,
    ...(worker.featured === true ? { featured: true } : {}),
    // The app's JSON package reader; packages/<id>.md (this repository's own format) is still published for people.
    package: `packages/${id}.json`,
    manifest: `teams/${id}/team.mausteam.json`,
    readme: `teams/${id}/README.md`,
    members: members.length,
    skills: skills.map((skill) => skill.path),
    requires: { apps: (worker.apps ?? []).map((app) => app.label) },
  };
  return {
    entry,
    files: [
      { path: entry.package, content: `${JSON.stringify(workerRealPackage(markdown, playbooksByName), null, 2)}\n` },
      { path: `packages/${id}.md`, content: workerPackage(markdown, playbooksByName) },
      { path: entry.manifest, content: `${JSON.stringify(manifest, null, 2)}\n` },
      { path: entry.readme, content: readme },
      ...skills,
    ],
  };
}

/** The catalog QACI Duo reads, workers ordered featured first, then by name. */
export function buildCatalog(entries) {
  const teams = [...entries].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.name.localeCompare(b.name));
  return { format: CATALOG_FORMAT, version: 1, teams };
}

// Repository layout. A Digital Worker is a folder, workers/<id>/, holding worker.yaml, BRIEF.md, souls/<key>.md
// (scripts/worker-files.mjs) and the skills only it carries
// (workers/<id>/skills/<name>/). A skill two or more workers carry, or none, lives in the top-level skills/<name>/.
// Skill names are unique across both places, because QACI Duo installs a skill by name.
const LAYOUT_ID = "[a-z0-9][a-z0-9-]*";
const LAYOUT_SKILL = "[a-z0-9]+(?:-[a-z0-9]+)*";
const SKILL_DIR = `(?:workers\\/(${LAYOUT_ID})\\/)?skills\\/(${LAYOUT_SKILL})`;
export const WORKER_FILE = new RegExp(`^workers\\/(${LAYOUT_ID})\\/worker\\.yaml$`);
/** The other files of a worker folder (scripts/worker-files.mjs): BRIEF.md, given to every agent, and souls/<key>.md. */
export const WORKER_BRIEF = new RegExp(`^workers\\/(${LAYOUT_ID})\\/BRIEF\\.md$`);
export const WORKER_SOUL = new RegExp(`^workers\\/(${LAYOUT_ID})\\/souls\\/([a-z0-9][a-z0-9_-]*)\\.md$`);
export const SKILL_FILE = new RegExp(`^${SKILL_DIR}\\/SKILL\\.md$`);

/** Where a repository path sits in the layout: the skill it belongs to (`owner` is null for a shared skill), or null. */
export function skillOf(path) {
  const match = new RegExp(`^${SKILL_DIR}\\/(SKILL\\.md|benchmark\\.yml|runs\\/(?:local|dev)\\.json)$`).exec(path);
  if (!match) return null;
  const [, owner = null, name, file] = match;
  return { owner, name, dir: owner ? `workers/${owner}/skills/${name}` : `skills/${name}`, file };
}

const ALLOWED_FILES = [
  WORKER_FILE,
  WORKER_BRIEF,
  WORKER_SOUL,
  SKILL_FILE,
  // A skill's benchmark cases, and what a QACI Duo answered on them (scripts/benchmark-lib.mjs).
  new RegExp(`^${SKILL_DIR}\\/benchmark\\.yml$`),
  new RegExp(`^${SKILL_DIR}\\/runs\\/(?:local|dev)\\.json$`),
  /^templates\/(?:worker\/(?:worker\.yaml|BRIEF\.md|souls\/[a-z0-9][a-z0-9_-]*\.md)|skill\/(?:SKILL\.md|benchmark\.yml))$/,
  /^scripts\/[a-z0-9-]+\.mjs$/,
  /^tests\/[a-z0-9.-]+\.mjs$/,
  // Declarative JSON Schema documenting the hand-written validators above.
  /^schema\/[a-z0-9.-]+\.schema\.json$/,
  /^\.github\/(?:CODEOWNERS|PULL_REQUEST_TEMPLATE\.md|workflows\/[a-z0-9-]+\.yml|ISSUE_TEMPLATE\/[a-z0-9-]+\.yml)$/,
  /^(?:README|CONTRIBUTING|FORMAT|SECURITY|AGENTS|CLAUDE|REVIEW_CHECKLIST)\.md$/,
  /^(?:LICENSE|package\.json|package-lock\.json|\.gitignore|next\.config\.ts|tsconfig\.json|next-env\.d\.ts)$/,
  // The public browsing website (Next.js App Router).
  /^app\/(?:[a-z0-9_.[\]-]+\/)*[a-z0-9_.[\]-]+\.(?:tsx|ts|css|svg)$/,
  /^components\/[A-Za-z0-9.-]+\.tsx$/,
  /^lib\/[a-z0-9.-]+\.ts$/,
];

/** Files a pull request may not add: anything outside the known layout (binaries, scripts beside a playbook, …). */
export function disallowedFiles(paths) {
  return paths.filter((path) => !ALLOWED_FILES.some((pattern) => pattern.test(path)));
}
