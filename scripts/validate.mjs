// npm test: checks every playbook and Digital Worker, the repository layout, secrets, and the library to publish.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_CATALOG_BYTES, buildCatalog, skillOf, disallowedFiles, readPlaybook, scanSecrets, splitPackage, validatePackage, validatePlaybook, validateWorker, workerLibraryFiles, workerPackage } from "./lib.mjs";
import { loadRepository } from "./repo.mjs";
import { parseBenchmark } from "./benchmark-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function trackedFiles() {
  try {
    const out = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" });
    return out.split("\0").filter(Boolean);
  } catch {
    const ids = readdirSync(join(root, "workers"));
    const workers = ids.map((id) => `workers/${id}/WORKER.md`);
    const own = ids.flatMap((id) => {
      try {
        return readdirSync(join(root, "workers", id, "skills")).map((name) => `workers/${id}/skills/${name}/SKILL.md`);
      } catch {
        return [];
      }
    });
    const shared = readdirSync(join(root, "skills")).map((name) => `skills/${name}/SKILL.md`);
    return [...workers, ...own, ...shared];
  }
}

const files = trackedFiles();
for (const path of disallowedFiles(files)) {
  errors.push(`${path}: this file is not allowed (a Digital Worker is workers/<id>/WORKER.md; its own skills are workers/<id>/skills/<name>/, shared skills are skills/<name>/)`);
}
for (const path of files) {
  let content;
  try {
    content = readFileSync(join(root, path), "utf8");
  } catch {
    continue;
  }
  if (content.includes("\0")) {
    errors.push(`${path}: binary files are not allowed`);
    continue;
  }
  for (const hit of scanSecrets(content)) errors.push(`${path}:${hit.line}: looks like ${hit.label}; remove it and use QACI Duo's app connections instead`);
}

const { playbooks, workers, errors: contentErrors } = loadRepository(root, files);
errors.push(...contentErrors);

// The templates must stay valid so a contributor always starts from a file that passes.
// Every benchmark.yml present must be valid; whether a changed skill has one is scripts/benchmark.mjs check's job.
for (const path of files.filter((file) => skillOf(file)?.file === "benchmark.yml" || file === "templates/skill/benchmark.yml")) {
  let raw;
  try {
    raw = readFileSync(join(root, path), "utf8");
  } catch {
    continue;
  }
  for (const problem of parseBenchmark(raw).errors) errors.push(`${path}: ${problem}`);
}
const templatePlaybook = readFileSync(join(root, "templates/skill/SKILL.md"), "utf8");
for (const problem of validatePlaybook(templatePlaybook, "your-playbook")) errors.push(`templates/skill/SKILL.md: ${problem}`);
const templateWorker = readFileSync(join(root, "templates/worker.md"), "utf8");
const templateProblems = validateWorker(templateWorker, "your-worker", new Set(["your-playbook"]));
for (const problem of templateProblems) errors.push(`templates/worker.md: ${problem}`);
if (templateProblems.length === 0 && errors.every((error) => !error.startsWith("templates/skill"))) {
  const generated = workerPackage(templateWorker, new Map([["your-playbook", readPlaybook(templatePlaybook)]]));
  for (const problem of validatePackage(generated, "your-worker")) errors.push(`templates/worker.md: the generated package is invalid: ${problem}`);
}

const catalog = JSON.stringify(buildCatalog(workers.map((worker) => workerLibraryFiles(worker.markdown, playbooks).entry)));
if (Buffer.byteLength(catalog) > MAX_CATALOG_BYTES) errors.push("catalog.json would exceed 256 KB, which QACI Duo refuses");

if (errors.length > 0) {
  console.error(`${errors.length} problem(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const used = new Set(workers.flatMap((worker) => {
    const { playbooks: carriesPlaybooks, skills: carriesSkills } = splitPackage(worker.markdown).metadata;
    return [...(carriesPlaybooks ?? []), ...(carriesSkills ?? [])];
  }));
  const loose = [...playbooks.keys()].filter((name) => !used.has(name));
  console.log(`OK: ${workers.length} Digital Worker(s) and ${playbooks.size} playbook(s) are valid; ${files.length} files scanned for secrets.`);
  if (loose.length) console.log(`Playbooks not carried by any Digital Worker (still importable through the Skills library): ${loose.join(", ")}`);
}
