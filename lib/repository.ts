import "server-only";

// A thin, typed wrapper around the SAME repository tooling `npm test` and `npm run build` use
// (scripts/lib.mjs, scripts/repo.mjs), so the site reads this repository's real workers/*.md and
// skills/*/SKILL.md through the one shared implementation rather than a second, ad hoc parser.
// scripts/lib.mjs/repo.mjs stay the source of truth: this file only shapes their output as TypeScript.
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// eslint-disable-next-line import/extensions -- shared ESM tooling lives in scripts/*.mjs, imported as-is (see above)
import { buildCatalog, splitPackage, workerPackage } from "../scripts/lib.mjs";
import { loadRepository } from "../scripts/repo.mjs";

export type DuoColor =
  | "green"
  | "blue"
  | "red"
  | "orange"
  | "purple"
  | "cyan"
  | "pink"
  | "yellow"
  | "teal"
  | "coral";

/**
 * The shape scripts/lib.mjs's `workerPackage()` writes and `validatePackage()` checks — see
 * schema/package.schema.json.
 */
export interface WorkerConnection {
  key: string;
  label: string;
  reason: string;
  mcp: { transport: "http" | "sse"; url: string; valueNames: string[] };
}

export interface WorkerSkill {
  name: string;
  description: string;
  source?: string;
  license?: string;
  compatibility?: string;
  instructions: string;
}

export interface WorkerPackage {
  format: "qaci-duo.package";
  version: 2;
  id: string;
  release: string;
  name: string;
  tagline: string;
  summary: string;
  category: string;
  author: { name: string; url?: string };
  license: string;
  featured?: boolean;
  tags?: string[];
  outcomes: string[];
  setupMinutes: number;
  requirements: {
    apps: Array<{ slug: string; label: string; reason: string; optional?: boolean }>;
    capabilities: string[];
    platforms?: string[];
  };
  team: { name: string; leader?: string; brief?: string };
  agents: Array<{
    key: string;
    name: string;
    title: string;
    description: string;
    appearance: { color: DuoColor };
    soul?: string;
    playbooks?: string[];
    skills?: string[];
    connections?: string[];
  }>;
  connections?: WorkerConnection[];
  rooms?: Array<{
    key: string;
    name: string;
    members: string[];
    bulletin: string;
    defaultResponder: { kind: "agent"; agent: string } | { kind: "everyone" } | { kind: "mentions" };
  }>;
  routines?: Array<{
    key: string;
    name: string;
    agent: string;
    prompt: string;
    runOn: "duo" | "cloud";
    schedule: { type: "once"; at: number } | { type: "daily"; time: string; weekdays: number[] };
    durationMinutes: number;
    enabledAfterInstall: false;
  }>;
  playbooks?: Array<{ key: string; name: string; summary: string; triggers: string[]; instructions: string }>;
  skills?: { version: 1; entries: WorkerSkill[] };
  examples?: Array<{ title: string; input: string; output: string }>;
  /**
   * Optional provenance field. No QACI Duo Digital Worker carries a revenue claim, so this is always absent
   * here. Kept so a future, genuine provenance field has somewhere to land without
   * another rename.
   */
  proof?: {
    amount: string;
    period: "monthly" | "weekly" | "daily" | "total";
    source: { url: string; author: string; date?: string; quote?: string };
    credibility?: "receipts" | "claimed";
  };
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function trackedPaths(): string[] {
  const out = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
  });
  return out.split("\0").filter(Boolean);
}

interface Loaded {
  entries: WorkerPackage[];
  markdownById: Map<string, string>;
}

let cache: Loaded | null = null;

/** Generates every worker's package in memory (the same bytes `npm run build` would write to
 * dist/packages/<id>.md) and parses each one back. Throws if the repository has a validation
 * problem `npm test` would also report — the site only ever shows content that already passes CI. */
function load(): Loaded {
  if (cache) return cache;
  const paths = trackedPaths();
  const { playbooks, workers, errors } = loadRepository(root, paths);
  if (errors.length > 0) {
    throw new Error(`The repository has ${errors.length} problem(s); run \`npm test\` for details.`);
  }
  const markdownById = new Map<string, string>();
  const entries: WorkerPackage[] = workers.map((worker: { id: string; markdown: string }) => {
    const markdown = workerPackage(worker.markdown, playbooks);
    markdownById.set(worker.id, markdown);
    const { metadata } = splitPackage(markdown);
    return metadata as WorkerPackage;
  });
  entries.sort(
    (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.name.localeCompare(b.name),
  );
  cache = { entries, markdownById };
  return cache;
}

export function getWorkers(): WorkerPackage[] {
  return load().entries;
}

export function getWorker(id: string): WorkerPackage | undefined {
  return load().entries.find((entry) => entry.id === id);
}

/** The generated package exactly as it will be published to packages/<id>.md on the `library` branch —
 * what people copy and paste into another agent product. */
export function getWorkerMarkdown(id: string): string | undefined {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return undefined;
  return load().markdownById.get(id);
}

const defaultRepository = "vntuananhbui/qaci-duo-digital-worker";

/** QACI Duo reads workers through the GitHub API on the generated `library` branch (see README.md), not `main`. */
export function workerRawUrl(id: string): string {
  const repository = process.env.NEXT_PUBLIC_REPOSITORY ?? defaultRepository;
  return `https://github.com/${repository}/raw/library/packages/${id}.md`;
}

/** Re-exported so the site builds its own catalog-shaped summary the same way `npm run build` does. */
export { buildCatalog };
