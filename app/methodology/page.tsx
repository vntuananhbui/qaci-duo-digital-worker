import type { Metadata } from "next";
import Link from "next/link";

// Explains the review pipeline documented in CONTRIBUTING.md / FORMAT.md / SECURITY.md.
export const metadata: Metadata = {
  title: "How QACI Duo playbooks work",
  description: "How a submission becomes a validated, reviewed, published QACI Duo Digital Worker.",
};

const principles = [
  ["01", "One capability per file, two ways to carry it", "A worker is a folder, workers/<id>/: its WORKER.md and the skills only it carries (skills/<name>/SKILL.md inside it); a skill several workers share lives in the top-level skills/<name>/. A worker carries each skill as a lightweight playbook (trigger + instructions) or embeds the whole file as a real skill — either way, the same file can be shared across workers."],
  ["02", "A worker can be a small team, not just one bot", "Optionally more than one agent, each with its own standing soul, a shared room to coordinate in, and declared MCP connections — a slot and a reason, never a credential, and only handed to the specific agent that needs it."],
  ["03", "CI checks it before a human does", "node scripts/validate.mjs rejects an unknown field, a missing section, a secret-shaped string, and common ways to hide instructions (long base64-like runs, curl | sh, invisible Unicode) — before a reviewer ever reads it."],
  ["04", "A code owner reads the content", "Is each step specific enough to repeat? Does the worker ask for its inputs before guessing? Does evidence stay separate from inference? Do sending, submitting, deleting and costly actions wait for approval?"],
  ["05", "Published automatically, nothing by hand", "Merging to main regenerates the library branch within about a minute. QACI Duo reads only that generated branch through a read-only GitHub API token — main itself is never read directly."],
];

export default function MethodologyPage() {
  return (
    <main className="methodology-page simple-page">
      <section className="methodology-hero simple-page-hero">
        <p className="overline">HOW QACI DUO PLAYBOOKS WORK</p>
        <h1>From pull request to Digital Worker.</h1>
        <p>Every worker and playbook in this library went through the same review pipeline — nothing is added by hand.</p>
        <div className="detail-actions"><Link href="/" className="button button-primary">Browse workers</Link><Link href="/publish" className="button button-secondary">Contribute one</Link></div>
      </section>

      <section className="methodology-grid" aria-label="Review pipeline">
        {principles.map(([number, title, body]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{body}</p></article>)}
      </section>

      <section className="package-anatomy">
        <div><span className="section-kicker">THE PIPELINE</span><h2>Pull request &rarr; published.</h2><p>Every step runs the same two commands a contributor runs locally first: npm test, then npm run build.</p></div>
        <pre><code>{`workers/<id>/WORKER.md + skills/<name>/SKILL.md
skills/<name>/SKILL.md   (shared)
  │
  ├── npm test        (CI: validate.yml)
  │     format, layout, secrets,
  │     hidden-instruction tricks
  ├── code owner review
  ├── merge to main
  ├── npm run build   (CI: publish.yml)
  │     dist/packages, catalog.json,
  │     teams/<id>/...
  └── force-pushed to \`library\``}</code></pre>
      </section>

      <section className="never-package">
        <span className="section-kicker">WHAT CI REFUSES</span><h2>A submission is instructions — never access.</h2>
        <div><span>Tokens or passwords</span><span>Credential-shaped fields</span><span>Binaries or extra files</span><span>curl | sh</span><span>Invisible Unicode</span><span>Long base64 runs</span></div>
        <p className="boundary-note">QACI Duo treats every imported file as untrusted: it reads the description, the soul and the procedure only, and grants no permissions on its own. A declared MCP connection is an address and the names of the values an installer will later supply — never a value itself — and nothing is actually connected until the installer connects it. A routine always installs paused — its owner switches it on.</p>
      </section>
    </main>
  );
}
