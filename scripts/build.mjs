// npm run build [-- <dir>]: writes the library QACI Duo reads. The publish workflow runs it after each merge and pushes
// the result to `library` (from main) or `library-dev` (from dev). The output is flat (packages/<id>.json,
// skills/<name>/SKILL.md) whatever the source layout, so QACI Duo never depends on where a file sits in this repository.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog, splitPackage, workerLibraryFiles } from "./lib.mjs";
import { loadRepository } from "./repo.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, process.argv[2] ?? "dist");
if (out === root || !out.startsWith(`${root}/`)) throw new Error("The output folder must be inside the repository");
const repository = process.env.GITHUB_REPOSITORY ?? "vanhaito/qaci-duo-playbooks";
const raw = (path) => `https://github.com/${repository}/raw/library/${path}`;

const paths = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" })
  .split("\0").filter(Boolean);
const { playbooks: found, workers, errors } = loadRepository(root, paths);
if (errors.length) throw new Error(`The repository has ${errors.length} problem(s); run npm test`);
// By name, not by where the file sits (workers/<id>/skills/ or skills/), so moving a skill never changes the output.
const playbooks = new Map([...found].sort(([a], [b]) => a.localeCompare(b)));

rmSync(out, { recursive: true, force: true });
const write = (path, content) => {
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), content);
};
const entries = [];
const usedBy = new Map();
for (const worker of workers) {
  const { entry, files } = workerLibraryFiles(worker.markdown, playbooks);
  entries.push(entry);
  for (const file of files) write(file.path, file.content);
  const { playbooks: carriesPlaybooks, skills: carriesSkills } = splitPackage(worker.markdown).metadata;
  for (const name of [...(carriesPlaybooks ?? []), ...(carriesSkills ?? [])]) usedBy.set(name, [...(usedBy.get(name) ?? []), entry.name]);
}
for (const playbook of playbooks.values()) write(`skills/${playbook.name}/SKILL.md`, playbook.raw);
const catalog = buildCatalog(entries);
write("catalog.json", `${JSON.stringify(catalog, null, 2)}\n`);
write("README.md", [
  "# QACI Duo playbook library (published)",
  "",
  "This branch is generated from `main` by the `Publish library` workflow. Do not edit it; open a pull request against `main`.",
  "",
  "## Digital Worker",
  "",
  "Install a whole Digital Worker in QACI Duo: **+ → Templates → Community templates → Load → Add team**.",
  "",
  ...catalog.teams.map((team) => `- **${team.name}** — ${team.summary}`),
  "",
  "## Playbook",
  "",
  "Add one playbook to a Digital Worker you already have: open its SKILL.md link, copy all of it, paste it into **Settings → Skills → Import a skill** (Settings shows Skills in Advanced mode), switch the skill on, then **Assign** it.",
  "",
  "| Playbook | What it does | Carried by | SKILL.md |",
  "|---|---|---|---|",
  ...[...playbooks.values()].map((playbook) =>
    `| ${playbook.title} | ${playbook.description} | ${(usedBy.get(playbook.name) ?? ["—"]).join(", ")} | [raw](${raw(`skills/${playbook.name}/SKILL.md`)}) |`),
  "",
].join("\n"));
console.log(`Built ${entries.length} Digital Workers and ${playbooks.size} playbooks in ${out}`);
