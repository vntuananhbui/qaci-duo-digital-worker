import type { Metadata } from "next";
import Link from "next/link";

// How to contribute; content drawn from CONTRIBUTING.md / FORMAT.md.
export const metadata: Metadata = {
  title: "Contribute a Digital Worker or playbook",
  description: "How to add or improve a QACI Duo Digital Worker or playbook.",
};

const repoUrl = "https://github.com/vntuananhbui/qaci-duo-digital-worker";

const steps = [
  ["01", "Branch from dev", "Fork the repository, or create a branch from dev if a code owner (see .github/CODEOWNERS) gave you write access. Read REVIEW_CHECKLIST.md first: it is what your pull request is judged against."],
  ["02", "Write the file(s)", "A new role is a folder, workers/<id>/, copied from templates/worker/: worker.yaml (configuration), BRIEF.md (what every agent must follow) and souls/<key>.md (each agent's own prompt), with each capability it carries in workers/<id>/skills/<name>/SKILL.md (from templates/skill/SKILL.md, with a benchmark.yml), carried as a playbook or a full embedded skill — optionally with more than one agent, each with its own soul, a shared room, and declared MCP connections. Follow FORMAT.md exactly — the folder/file name must match the name/id field inside it."],
  ["03", "Check, try, benchmark, then open a pull request into dev", "npm ci --ignore-scripts, npm test and npm run build; try it in QACI Duo; run each changed skill's benchmark cases (node scripts/benchmark.mjs init <skill> --env local) and paste the answers. Open the pull request against dev: CI validates and an LLM judge scores the benchmark, then a code owner reviews it against the checklist. After the merge it is live on the dev QACI Duo; it reaches production only after it is benchmarked on dev and a code owner promotes dev to main."],
];

export default function PublishPage() {
  return (
    <main className="publish-page simple-page">
      <section className="publish-hero simple-page-hero">
        <p className="overline">CONTRIBUTE TO QACI DUO PLAYBOOKS</p>
        <h1>Add a capability, or a role that carries several.</h1>
        <p>A playbook is one procedure that produces a result. A Digital Worker is a role — it carries several playbooks or embedded skills (or both) and knows which one to pick, alone or as a small team of agents.</p>
        <div className="detail-actions">
          <a className="button button-primary" href={`${repoUrl}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer">Read CONTRIBUTING.md ↗</a>
          <a className="button button-secondary" href={`${repoUrl}/blob/main/FORMAT.md`} target="_blank" rel="noreferrer">Read the file format ↗</a>
        </div>
      </section>

      <section className="publish-steps">
        {steps.map(([number, title, body]) => (
          <article key={number}>
            <span>{number}</span><h2>{title}</h2><p>{body}</p>
          </article>
        ))}
      </section>

      <section className="package-anatomy">
        <div>
          <span className="section-kicker">A DIGITAL WORKER</span>
          <h2>One role, several playbooks or skills.</h2>
          <p>workers/&lt;id&gt;/worker.yaml lists the playbooks and/or skills it carries and (optionally) extra teammates, a shared room, declared MCP connections and paused routines. BRIEF.md is what every agent follows; souls/ holds each agent's own prompt. See FORMAT.md.</p>
        </div>
        <pre><code>{`workers/<id>/
├── worker.yaml   name, title, tagline, outcomes,
│                 apps, playbooks / skills,
│                 connections, agents, rooms, routines
├── BRIEF.md      every agent follows it: Mission,
│                 Working rules, Completion rule
├── souls/<key>.md  one agent's own standing prompt
└── skills/<name>/  SKILL.md + benchmark.yml`}</code></pre>
      </section>

      <section className="never-package">
        <span className="section-kicker">NEVER INCLUDE</span>
        <h2>A playbook is instructions — not access.</h2>
        <div><span>Credentials</span><span>Tokens or passwords</span><span>Personal data</span><span>Internal links</span><span>Routines enabled by default</span><span>Binaries or extra files</span></div>
        <p className="boundary-note">Every routine installs paused. A connection is a declared address and the names of the values it needs — never a value itself — and QACI Duo connects no apps on its own; the user connects their own.</p>
      </section>

      <p className="simple-page-back"><Link href="/">← Back to all workers</Link></p>
    </main>
  );
}
