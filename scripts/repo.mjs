// Reads the repository's playbooks and Digital Workers once, for both `npm test` and `npm run build`.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readPlaybook, splitPackage, validatePackage, validatePlaybook, validateWorker, workerPackage } from "./lib.mjs";

const PLAYBOOK_PATH = /^skills\/([^/]+)\/SKILL\.md$/;
const WORKER_PATH = /^workers\/([^/]+)\.md$/;

/** Valid playbooks by name, valid workers, and every problem found, from the given repository-relative paths. */
export function loadRepository(root, paths) {
  const errors = [];
  const playbooks = new Map();
  for (const path of paths.filter((path) => PLAYBOOK_PATH.test(path)).sort()) {
    const raw = readFileSync(join(root, path), "utf8");
    const problems = validatePlaybook(raw, path.match(PLAYBOOK_PATH)[1]);
    for (const problem of problems) errors.push(`${path}: ${problem}`);
    if (problems.length === 0) playbooks.set(path.match(PLAYBOOK_PATH)[1], readPlaybook(raw));
  }
  const names = new Set(paths.map((path) => path.match(PLAYBOOK_PATH)?.[1]).filter(Boolean));
  const workers = [];
  for (const path of paths.filter((path) => WORKER_PATH.test(path)).sort()) {
    const markdown = readFileSync(join(root, path), "utf8");
    const id = path.match(WORKER_PATH)[1];
    const problems = validateWorker(markdown, id, names);
    for (const problem of problems) errors.push(`${path}: ${problem}`);
    if (problems.length > 0) continue;
    const { metadata } = splitPackage(markdown);
    if ([...(metadata.playbooks ?? []), ...(metadata.skills ?? [])].some((name) => !playbooks.has(name))) continue; // reported above
    // The generated package must pass the same checks a hand-written QACI Duo package file would.
    const generated = validatePackage(workerPackage(markdown, playbooks), id);
    for (const problem of generated) errors.push(`${path}: the generated package is invalid: ${problem}`);
    if (generated.length === 0) workers.push({ id, path, markdown });
  }
  return { playbooks, workers, errors };
}
