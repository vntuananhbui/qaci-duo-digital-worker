// Regenerates one of this repository's QACI Duo official workers from the real, already-built package JSON in
// qaci-duo (docs/playbooks/qaciduo-<id>.json, built by qaci-duo's own scripts/build-*-playbook.ts). Re-run this
// whenever that file changes release, instead of hand-copying soul/skill text again:
//
//   node scripts/import-from-qaci-duo.mjs <path/to/qaciduo-adlc.json> adlc
//   node scripts/import-from-qaci-duo.mjs <path/to/qaciduo-app-rebuild.json> craft
//
// It writes workers/<id>.md and skills/<skill-name>/SKILL.md for every skill the source package carries, then
// self-checks the result with this repository's own validateWorker/workerPackage/validatePackage — the same gate
// `npm test` runs — before anything is written to disk, so a bad source file fails loudly instead of landing.
//
// What this script cannot get from the source JSON (because the real package has no such field, or doesn't have
// it populated yet): the *worker's own* top-level framing (a short name/title/description for the installed
// identity QACI Duo's package format forces every worker to have as one of its own agents), which real agent is
// actually the team's lead, and suggested example questions. That
// top-level identity is a nameless, roomless, soul-less wrapper rather than reusing the lead's own key — reusing
// it would break that agent's own soul text, which self-references its real key via `{{agent:<key>}}`.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify as stringifyYaml } from "yaml";
import { readPlaybook, validatePackage, validateWorker, workerPackage } from "./lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Per-worker framing the real package JSON does not carry. Add an entry here for a new official worker. */
const IMPORTS = {
  adlc: {
    name: "QACI Duo ADLC",
    title: "Coordinates PM, Tech Lead, Engineer and Deployer",
    description:
      "The installed identity for QACI Duo's own four-agent software team (ADLC: Agentic Development Lifecycle). " +
      "The owner gives work to the PM — in a direct chat with it, or in the team's shared room — and the PM " +
      "classifies it, writes the acceptance criteria, and hands it to the Tech Lead, who plans, assigns the " +
      "Engineer, verifies the result itself under real conditions, and merges. The Deployer only acts when asked, " +
      "and always asks first before anything leaves the system (pushing to the owner's own GitHub, creating a " +
      "release, deploying a demo).",
    color: "pink",
    leaderKey: "pm",
    // The real source has no `examples` yet (checked against qaciduo-adlc.json at the time this script was
    // written) — these are authored here, not invented per import, so a re-run stays in sync with this file
    // instead of silently dropping them. Prefer pkg.examples once the real package starts carrying real ones.
    examples: [
      {
        title: "Fix a bug end to end",
        input: "There's a bug where the export button downloads an empty CSV when a filter is active. Fix it.",
        output: "PM classifies it as a bugfix and writes acceptance criteria (export respects the active filter, has at least one row when the filtered data isn't empty). Tech Lead plans the fix and assigns the Engineer, who reproduces the bug with a failing test, fixes it, and pushes. Tech Lead verifies under real conditions — not just the engineer's report — then merges. PM reports back with the evidence package: what was tested, the real output, and the commit.",
      },
      {
        title: "Turn a paper into a running prototype",
        input: "Here's a link to a paper on lead-wise attention for ECG classification. Can the team build a small prototype that reproduces the core method?",
        output: "PM classifies it as paper-prototype and confirms scope with the owner. Tech Lead plans the smallest reproduction behind a flag that keeps today's behavior when off; the Engineer implements it and runs small checks (unit test, single-batch overfit, flag-off parity) before proposing a full run. Tech Lead verifies the result against the paper's own claims. PM reports what matched, what didn't, and what still needs the owner's decision before any larger run.",
      },
    ],
  },
  craft: {
    name: "QACI Duo App Rebuild",
    title: "Coordinates Analyst, Engineer, Checker and Deployer",
    description:
      "The installed identity for QACI Duo's clean-room app rebuild team (\"Craft Anything\"). The owner gives " +
      "the Analyst a website, app or tool they own or are allowed to analyze; the Analyst verifies that " +
      "permission, studies the original with Craft Anything, and writes a SPEC.md that describes only behavior. " +
      "The Engineer builds the new version from the spec alone and never sees the original. The Checker compares " +
      "the two versions' behavior from the outside and writes PARITY.md. Every step that touches the original, " +
      "runs its code, or sends the new version anywhere waits for the owner's approval first.",
    color: "purple",
    leaderKey: "analyst",
    examples: [
      {
        title: "Rebuild a tool I already own",
        input: "I own this internal admin dashboard (link). I want a modernized version with the same features, in a new stack.",
        output: "Analyst verifies the ownership/permission basis with a card before touching anything, studies the original with Craft Anything, and writes SPEC.md describing only its observable behavior and acceptance criteria — no code or content from the original. Engineer builds the new version from that spec alone, never seeing the original, with tests for each criterion. Checker compares both versions from the outside (screenshots at several widths, the same user flows) and writes PARITY.md. Analyst reports the permission basis, the parity result, and any remaining differences.",
      },
      {
        title: "Check if the rebuild really matches",
        input: "The rebuilt app seems done — can Checker confirm it behaves like the original before I ship it?",
        output: "Checker compares the new version against the original from the outside using Craft Anything — screenshots at multiple widths, the same interaction flows — against SPEC.md's acceptance criteria, and writes PARITY.md listing what matches and what doesn't. A mismatch goes back to the Engineer, up to three rounds, before Analyst reports the final parity result to the owner.",
      },
    ],
  },
};

const [, , sourcePath, importKey] = process.argv;
const config = IMPORTS[importKey];
if (!sourcePath || !config) {
  console.error(`Usage: node scripts/import-from-qaci-duo.mjs <source.json> <${Object.keys(IMPORTS).join("|")}>`);
  process.exit(2);
}

const pkg = JSON.parse(readFileSync(resolve(sourcePath), "utf8")).package;
if (!pkg?.agents?.length) throw new Error(`${sourcePath}: not a QACI Duo package with agents`);
if (!pkg.agents.some((agent) => agent.key === config.leaderKey)) {
  throw new Error(`${sourcePath}: no agent with key "${config.leaderKey}" (set IMPORTS.${importKey}.leaderKey to the real lead's key)`);
}

// --- Playbook files: one skills/<name>/SKILL.md per skill the source embeds, synthesizing the fields this
// repository's own SKILL.md convention requires (title, triggers, license, author) but the real skill format
// (shared/skill-md.ts) does not — it only has name/description/tags.
const needsQuote = (value) => value.includes(": ") || /^[-?:&*!|>%@`"']/.test(value) || value.endsWith(":");
const yq = (value) => (needsQuote(value) ? JSON.stringify(value) : value);
const titleFromBody = (body) => body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";

function triggersFor(name, title) {
  const spaced = name.replace(/-/g, " ");
  const cleanTitle = title.replace(/\s*\([^)]*\)\s*/g, " ").trim().toLowerCase();
  const triggers = [spaced];
  if (cleanTitle && cleanTitle !== spaced) triggers.push(cleanTitle);
  return triggers.slice(0, 3);
}

function writePlaybookFile(skill) {
  const match = skill.instructions.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`skill "${skill.name}": instructions do not start with SKILL.md frontmatter`);
  const body = match[2];
  const title = titleFromBody(body) || skill.name;
  const triggersLine = triggersFor(skill.name, title).join(", ");
  const frontmatter = [
    "---",
    `name: ${skill.name}`,
    `title: ${yq(title.slice(0, 100))}`,
    `description: ${yq(skill.description)}`,
    `triggers: ${yq(triggersLine)}`,
    "tags: adlc-craft, internal",
    `license: ${yq(skill.license ?? pkg.license ?? "Unspecified")}`,
    `author: ${yq(pkg.author?.name ?? "QACI Duo")}`,
    "---",
    "",
  ].join("\n");
  const content = `${frontmatter}${body.replace(/^\n+/, "\n")}`;
  const dir = resolve(root, "skills", skill.name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "SKILL.md"), content);
  return content;
}

const skillsByName = new Map((pkg.skills?.entries ?? []).map((skill) => [skill.name, writePlaybookFile(skill)]));
console.log(`Wrote ${skillsByName.size} skills/*/SKILL.md file(s).`);

// --- workers/<id>.md: the real agents (keys unchanged, so each agent's own soul's {{agent:<key>}} self-references
// still resolve) plus the worker's own framing from IMPORTS above. `pkg.agents` already has `agent.soul`,
// `agent.skills` and `agent.connections` in the real shape this repository's workerPackage() also produces, so
// they carry over directly — nothing here is re-derived or guessed.
const agents = pkg.agents.map((agent) => ({
  key: agent.key,
  name: agent.name,
  title: agent.title,
  description: agent.description,
  color: agent.appearance.color,
  ...(agent.soul ? { soul: agent.soul } : {}),
  ...(agent.skills?.length ? { skills: agent.skills } : {}),
  ...(agent.connections?.length ? { connections: agent.connections } : {}),
}));
const allSkillNames = [...new Set(agents.flatMap((agent) => agent.skills ?? []))];
const rooms = (pkg.rooms ?? []).map((room) => ({
  key: room.key,
  name: room.name,
  bulletin: room.bulletin,
  members: room.members,
  defaultResponder: room.defaultResponder,
}));

const frontmatter = {
  id: importKey,
  release: pkg.release,
  name: config.name,
  title: config.title,
  tagline: pkg.tagline,
  description: config.description,
  category: pkg.category,
  author: { name: pkg.author.name },
  license: pkg.license,
  color: config.color,
  outcomes: pkg.outcomes,
  setupMinutes: pkg.setupMinutes,
  skills: allSkillNames,
  agents,
  chiefOfStaff: config.leaderKey,
  ...(pkg.team?.brief ? { teamBrief: pkg.team.brief } : {}),
  ...(rooms.length ? { rooms } : {}),
  ...(pkg.connections?.length ? { connections: pkg.connections } : {}),
  ...((pkg.examples ?? config.examples)?.length ? { examples: pkg.examples ?? config.examples } : {}),
};

const delegationRows = agents
  .filter((agent) => agent.key !== config.leaderKey)
  .map((agent) => `  | ${agent.title} work | \`coordinate_bots\` to \`${agent.key}\` |`)
  .join("\n");

const body = `# ${config.name}

## Mission

${pkg.summary}

## Working rules

- **Start by asking** the owner for the work in a direct chat with \`${config.leaderKey}\` — the team's Chief of Staff — or in the shared room.
- **Delegate by role:**

  | When the work is… | Hand it to |
  |---|---|
${delegationRows}

- **Evidence:** every number reported (test results, measurements, run time) comes from the actual output of that run, with its source (command, file path) — never copied from memory or a different run.
- **Approval:** anything that leaves the system — pushing to the owner's own GitHub, creating a release, deploying a demo, spending money, or touching anything outside what was explicitly given — always waits for an explicit card, even when the team's other approval points are set to auto-approve.
- **Privacy:** never ask for passwords or tokens in chat; use QACI Duo's app connections.

## Completion rule

Return one result to the owner, in the conversation where the work was given: the outcome first, then the evidence behind it, then anything that still needs the owner's decision.
`;

const yamlText = stringifyYaml(frontmatter, { lineWidth: 0 }).trimEnd();
const markdown = `---\n${yamlText}\n---\n\n${body}`;

// --- Self-check before writing: the same gate `npm test` runs, so a bad source file (or a stale IMPORTS entry)
// fails here with a clear reason instead of landing as a broken worker.
const playbookNames = new Set(skillsByName.keys());
const workerErrors = validateWorker(markdown, importKey, playbookNames);
if (workerErrors.length) {
  console.error(`workers/${importKey}.md would be invalid:`);
  for (const error of workerErrors) console.error(`- ${error}`);
  process.exit(1);
}
const parsedPlaybooks = new Map([...skillsByName.entries()].map(([name, raw]) => [name, readPlaybook(raw)]));
const generated = workerPackage(markdown, parsedPlaybooks);
const packageErrors = validatePackage(generated, importKey);
if (packageErrors.length) {
  console.error(`The package generated from workers/${importKey}.md would be invalid:`);
  for (const error of packageErrors) console.error(`- ${error}`);
  process.exit(1);
}

writeFileSync(resolve(root, "workers", `${importKey}.md`), markdown);
console.log(`Wrote workers/${importKey}.md from ${sourcePath} (release ${pkg.release}).`);
