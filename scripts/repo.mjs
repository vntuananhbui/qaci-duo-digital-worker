// Reads the repository's skills and Digital Workers once, for both `npm test` and `npm run build`.
//
// Layout (scripts/lib.mjs WORKER_FILE, SKILL_FILE): a folder per worker, workers/<id>/ with worker.yaml, BRIEF.md and
// souls/<key>.md (scripts/worker-files.mjs), the skills only that worker carries in workers/<id>/skills/<name>/SKILL.md,
// and skills shared by several workers (or by none) in skills/<name>/SKILL.md.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assembleWorker } from "./worker-files.mjs";
import { SKILL_FILE, WORKER_BRIEF, WORKER_FILE, WORKER_SOUL, readPlaybook, splitPackage, validatePackage, validatePlaybook, validateWorker, workerPackage } from "./lib.mjs";

/**
 * Valid skills by name (`playbooks`, the name the package builder knows them by), where each lives (`skillDirs`),
 * valid workers, and every problem found, from the given repository-relative paths.
 */
export function loadRepository(root, paths) {
  const errors = [];
  const playbooks = new Map();
  const owners = new Map(); // skill name -> owning worker id, or null for skills/<name>/
  const skillDirs = new Map();
  for (const path of paths.filter((path) => SKILL_FILE.test(path)).sort()) {
    const [, owner = null, name] = SKILL_FILE.exec(path);
    if (owners.has(name)) {
      errors.push(`${path}: a skill named "${name}" already exists in ${skillDirs.get(name)}; skill names must be unique across the repository`);
      continue;
    }
    owners.set(name, owner);
    skillDirs.set(name, path.slice(0, -"/SKILL.md".length));
    const raw = readFileSync(join(root, path), "utf8");
    const problems = validatePlaybook(raw, name);
    for (const problem of problems) errors.push(`${path}: ${problem}`);
    if (problems.length === 0) playbooks.set(name, readPlaybook(raw));
  }

  const workers = [];
  const carriers = new Map(); // skill name -> worker ids that carry it
  const read = (path) => readFileSync(join(root, path), "utf8");
  const workerIds = new Set(paths.filter((path) => WORKER_FILE.test(path)).map((path) => WORKER_FILE.exec(path)[1]));
  for (const path of paths.filter((path) => WORKER_BRIEF.test(path) || WORKER_SOUL.test(path))) {
    const id = (WORKER_BRIEF.exec(path) ?? WORKER_SOUL.exec(path))[1];
    if (!workerIds.has(id)) errors.push(`${path}: workers/${id}/worker.yaml is missing`);
  }
  for (const path of paths.filter((path) => WORKER_FILE.test(path)).sort()) {
    const id = WORKER_FILE.exec(path)[1];
    const briefPath = `workers/${id}/BRIEF.md`;
    const souls = Object.fromEntries(paths.filter((file) => WORKER_SOUL.exec(file)?.[1] === id).map((file) => [WORKER_SOUL.exec(file)[2], read(file)]));
    const assembled = assembleWorker({ yaml: read(path), brief: paths.includes(briefPath) ? read(briefPath) : undefined, souls });
    if (!assembled.markdown) {
      for (const problem of assembled.errors) errors.push(`workers/${id}/${problem}`);
      continue;
    }
    const markdown = assembled.markdown;
    const problems = validateWorker(markdown, id, new Set(owners.keys()));
    let carried = [];
    if (!problems.length) {
      const { metadata } = splitPackage(markdown);
      carried = [...new Set([...(metadata.playbooks ?? []), ...(metadata.skills ?? [])])];
      for (const name of carried) {
        carriers.set(name, [...(carriers.get(name) ?? []), id]);
        const owner = owners.get(name);
        if (owner && owner !== id) {
          problems.push(`"${name}" belongs to workers/${owner}/; move it to skills/${name}/ so both workers can carry it`);
        }
      }
    }
    for (const problem of problems) errors.push(`${path}: ${problem}`);
    if (problems.length > 0 || carried.some((name) => !playbooks.has(name))) continue; // reported above
    // The generated package must pass the same checks a hand-written QACI Duo package file would.
    const generated = validatePackage(workerPackage(markdown, playbooks), id);
    for (const problem of generated) errors.push(`${path}: the generated package is invalid: ${problem}`);
    if (generated.length === 0) workers.push({ id, path, markdown });
  }

  // A skill in a worker's own folder that the worker does not carry is in the wrong place.
  for (const [name, owner] of owners) {
    if (owner && !(carriers.get(name) ?? []).includes(owner)) {
      errors.push(`${skillDirs.get(name)}/SKILL.md: workers/${owner}/worker.yaml does not carry "${name}"; add it to its playbooks or skills, or move the folder to skills/${name}/`);
    }
  }
  return { playbooks, skillDirs, workers, errors };
}
