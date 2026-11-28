import assert from "node:assert/strict";
import { test } from "node:test";
import { splitPackage } from "../scripts/lib.mjs";
import { assembleWorker, splitWorker } from "../scripts/worker-files.mjs";

const yaml = `# a comment that must survive
id: demo
release: 1.0.0
name: Demo
agents:
  - key: helper
    name: Helper
`;
const brief = `Shared intro.

## Mission

Do the job.

## Working rules

- Ask first.

## Completion rule

Done when delivered.
`;

test("BRIEF.md becomes teamBrief verbatim, and souls/<key>.md the souls", () => {
  const { markdown, errors } = assembleWorker({ yaml, brief, souls: { helper: "Helper soul.\n", demo: "Own soul.\n" } });
  assert.deepEqual(errors, []);
  const { metadata, body } = splitPackage(markdown);
  assert.equal(metadata.teamBrief, brief.trimEnd());
  assert.equal(metadata.agents[0].soul, "Helper soul.");
  assert.equal(metadata.soul, "Own soul.");
  assert.match(body, /## Working rules\n\n- Ask first\./);
});

test("a soul or brief written inline in worker.yaml is refused, so there is one place for each", () => {
  const inline = `${yaml}teamBrief: x\nsoul: y\n`.replace("    name: Helper", "    name: Helper\n    soul: z");
  const { markdown, errors } = assembleWorker({ yaml: inline, brief });
  assert.equal(markdown, null);
  assert.match(errors.join("\n"), /teamBrief is not set here/);
  assert.match(errors.join("\n"), /soul is not set here/);
  assert.match(errors.join("\n"), /agents\[0\]\.soul is not set here; write it in souls\/helper\.md/);
});

test("a missing BRIEF.md, a missing section, or a soul for no agent is refused", () => {
  assert.match(assembleWorker({ yaml }).errors.join("\n"), /BRIEF\.md is missing/);
  assert.match(assembleWorker({ yaml, brief: brief.replace("## Completion rule", "## Done") }).errors.join("\n"), /`## Completion rule` section/);
  assert.match(assembleWorker({ yaml, brief, souls: { stranger: "x" } }).errors.join("\n"), /souls\/stranger\.md/);
});

test("splitting keeps YAML comments and every soul byte for byte; assembling again gives the same worker", () => {
  const { markdown } = assembleWorker({ yaml, brief, souls: { helper: "Line one.\n\nLine two.\n" } });
  const parts = splitWorker(markdown);
  assert.equal(parts.souls.helper, "Line one.\n\nLine two.\n");
  assert.ok(!/soul|teamBrief/.test(parts.yaml));
  const again = assembleWorker(parts);
  assert.deepEqual(splitPackage(again.markdown).metadata, splitPackage(markdown).metadata);
  const commented = splitWorker(`---\n${yaml}---\n\n## Mission\n\nm\n\n## Working rules\n\nw\n\n## Completion rule\n\nc\n`);
  assert.match(commented.yaml, /^# a comment that must survive/);
  assert.match(commented.brief, /^## Mission\n\nm\n\n## Working rules\n\nw\n\n## Completion rule\n\nc\n$/);
});
