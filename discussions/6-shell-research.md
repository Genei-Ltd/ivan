# Lovable shell: build-base research

Research into the "basic Lovable" workstream from [5-lovable-comparison.md](./5-lovable-comparison.md): the shell that takes a GitHub repo, lets someone edit it through an agent with a live preview, and ends in a PR. The Aiven data-forking layer, warm pools, and prod promotion are out of scope here and live in [5-architecture.md](./5-architecture.md). This document settles what to fork and what to build on top.

Method: fan-out web search across six angles, fetched 25 sources (overwhelmingly first-party vendor docs and official repos), extracted 113 claims, adversarially verified the top 25 (need 2 of 3 votes to kill a claim). 21 confirmed, 4 killed. Date context: June 2026, so re-check the fast-moving Vercel limits before committing.

## The five hard requirements

The shell must:

1. Connect an existing GitHub repo (our locked Next.js 16 / App Router / pnpm template), not generate greenfield.
2. Host the Anthropic Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`, headless Claude Code engine) as the coding agent. Harness is already chosen, not up for re-evaluation.
3. Hot-reloading live preview: a sandboxed `next dev` (Turbopack HMR) on a public URL, shown in an iframe. Not Vercel per-commit preview deploys.
4. End by opening a PR back into the same repo (branch per session, commit, `gh pr create` or the API).
5. Full-stack changes including DB schema migrations. The preview needs a real `DATABASE_URL` to an external Postgres, so the sandbox must run `psql` / node DB clients and hold a long-lived backend process.

## Verdict

Fork `vercel-labs/coding-agent-template` and run it on Vercel Sandbox. It already wires the three hardest pieces, the agent-in-sandbox, the existing-repo connect, and the branch-commit-push, on our exact stack. The two things it does not do, the live HMR iframe preview and the PR creation, are the build work. Do not fork a Lovable/v0/bolt clone, and do not assemble from scratch.

## Sandbox: Vercel Sandbox

The clear winner, and it happens to be the Vercel stack we already pay for.

- Each session is an isolated Firecracker microVM with a dedicated kernel, Amazon Linux 2023, sudo/root, full network, and git preinstalled. Because it is a real Linux microVM rather than a browser runtime, it runs the native `psql` binary and a node pg client over raw TCP to an external Postgres, and holds a long-lived `next dev` process. This is what satisfies requirements 2 and 5.
- Each exposed port gets its own public HTTPS subdomain (`https://sb-[id].vercel.run`). Up to 15 open ports across all plans. "Run development servers: spin up and test applications with live previews" is a documented use case. This is what the iframe points at.
- Sessions: 5 minute default timeout, extendable via `sandbox.extendTimeout()`, max 45 minutes on Hobby and 24 hours on Pro/Enterprise. 24h on Pro comfortably covers a long editing session.
- There is an official Vercel KB guide for hosting the Claude Agent SDK as a long-lived process inside the sandbox, which describes the SDK as "a long-running process that executes commands, manages files, and maintains conversational state". Cleanest possible fit for the chosen harness.

Caveat on the limits: these numbers have moved fast (port limit rose to 15, max duration went 45min then 5h then 24h within about nine months). A "5 hours" max-duration figure appears in older changelogs and some blog summaries; it is stale and was explicitly refuted in verification. Current cap is 24h on Pro. Re-check pricing and limits before committing.

Sources: https://vercel.com/docs/sandbox, https://vercel.com/docs/sandbox/system-specifications, https://vercel.com/docs/sandbox/pricing, https://vercel.com/changelog/vercel-sandbox-increases-concurrency-and-port-limits, https://vercel.com/kb/guide/using-vercel-sandbox-claude-agent-sdk

## Fork base: `vercel-labs/coding-agent-template`

Official vercel-labs repo, v2.0.0, actively maintained as of June 2026. README tagline, verbatim: "A template for building AI-powered coding agents that supports Claude Code, OpenAI's Codex CLI, GitHub Copilot CLI, Cursor CLI, Google Gemini CLI, and opencode with Vercel Sandbox to automatically execute coding tasks on your repositories."

What it already gives us, mapped to the requirements:

- Requirement 1, existing repo: "Enter a repository URL and describe what you want the AI to do." Connects by URL, no greenfield.
- Requirement 2, harness: native Claude Code support, per-agent keys (`ANTHROPIC_API_KEY`). The "Claude Code" here is the headless CLI that is the engine behind the Claude Agent SDK, so the fit is real.
- Branch per session: "Automatically generates descriptive Git branch names" with unique alphanumeric suffixes to prevent conflicts.
- Commits: "Changes are committed and pushed to the AI-generated branch."
- Per-user auth: "Each user uses their own GitHub token for repository access, no shared credentials."

Source: https://github.com/vercel-labs/coding-agent-template

## The two gaps (this is the build work)

The template is a one-shot task tool. Two requirements are not covered and constitute the core work:

1. Live hot-reloading iframe preview (requirement 3). The template only starts a dev server in the background under "Keep Alive", and its AGENTS.md actively tells the agent not to run dev servers ("DO NOT run development servers... they will conflict"), because the platform auto-manages it. There is no exposed public-URL iframe preview UI. You build the exposed-preview path: run `next dev` on an exposed port, surface the `sb-[id].vercel.run` URL in an iframe, override the template's background-only behaviour.

2. PR creation (requirement 4). The flow stops at branch, commit, push. There is no mention of pull requests, `gh pr create`, or the GitHub PR API anywhere. You add a PR-creation step after push.

Plus the DB wiring (requirement 5): inject `DATABASE_URL` as sandbox env and run migrations with `psql` / node clients. The microVM handles this natively, so it is plumbing, not a research risk.

## Glue plan

Components to wire, each mapped to a verified primitive:

1. Repo connect, branch, commit, push: provided by the template.
2. Claude Agent SDK as long-lived process in the sandbox: supported by the Vercel KB guide; install the SDK and Claude Code CLI in the sandbox image.
3. Long-lived `next dev` on an exposed port, surfaced as `sb-[id].vercel.run` in an iframe: supported by per-port public URLs and the dev-server-with-live-preview use case, but not shipped by the template, so this is build work. Put it behind auth (see risks).
4. PR creation: add `gh pr create` or the GitHub PR API after push. Build work.
5. DB migrations: sudo Linux microVM runs `psql` / node clients over real TCP to an external Postgres; inject `DATABASE_URL` as sandbox env.

Confidence on this assembled plan is medium, not high, because no single source verified the full chain working end to end. The individual primitives are each high-confidence; the assembly is ours to prove.

## The one risk to spike first

Nobody verified that Next.js 16 Turbopack HMR (its WebSocket dev channel) proxies cleanly through the public `sb-[id].vercel.run` port URL when rendered inside a cross-origin iframe. This is the single load-bearing assumption in the whole recommendation.

Spike it before building any UI: fork the template, run `next dev` on an exposed port, load the public URL in an iframe, edit a file, confirm HMR fires in the iframe. If it does not work, that is the moment to reconsider, not after building the workspace around it. Mitigations if it fights us: `allowedDevOrigins` for the sandbox host, confirming the WebSocket upgrade survives the proxy hop, or same-origin tricks.

## Other open questions

- Per-session Postgres isolation: how to give each concurrent agent session its own DB state so migrations do not corrupt a shared `DATABASE_URL`. Neon branching is the obvious fit and maps cleanly onto the Aiven fork story in [5-architecture.md](./5-architecture.md).
- Auth on the preview: exposed sandbox ports are public, so the iframe preview is internet-exposed. Add basic auth, a signed URL, or Vercel access control for an internal tool.
- Element selection (sub-question C) is unresolved, see below.

## Ruled out, with reasons

- WebContainers / StackBlitz (the foundation under bolt.diy and most greenfield clones): decisively out on requirement 5. It is browser-only WebAssembly execution on the local CPU with no server-side container. It "can only execute languages that are natively supported on the Web", native addons are disabled by default, and "direct TCP database connections are not supported" (their docs list Postgres/MySQL/MongoDB as unsupported and point only at HTTP API providers like Neon's serverless driver). It cannot run native `psql` or open a raw TCP socket to an external Postgres. The prediction that WebContainers would be ruled out is confirmed. Sources: https://developer.stackblitz.com/platform/webcontainers/troubleshooting-webcontainers, https://developer.stackblitz.com/guides/user-guide/general-faqs, https://webcontainers.io/, https://github.com/stackblitz/webcontainer-core/issues/286
- OpenHands: out as a fork base. It ships its own agent runtime (the Agent Server, "a REST API for running multiple agents on a single machine") with its own loop, so it would displace the chosen Claude Agent SDK, and its execution model is a Docker sandbox, not the Vercel stack. It does nail requirements 1 and 4 (GitHub integration, issue-to-PR via openhands-resolver), but adopting it means fighting its native runtime to host our harness and bringing Docker instead of Vercel Sandbox. More rework than forking the Vercel template, and off-stack. Sources: https://github.com/OpenHands/OpenHands, https://github.com/OpenHands/software-agent-sdk

Note on breadth: bolt.diy, Dyad, Firecrawl's Open Lovable, AI SDK + AI Elements, and the E2B/Daytona/Modal/Fly/CodeSandbox head-to-head did not produce surviving verified claims in this pass. Their exclusion rests on the WebContainers and OpenHands evidence plus first principles (greenfield generators, wrong execution model, or simply more glue than the Vercel template), not on verified per-tool findings. If we want to harden the sandbox choice specifically, a targeted E2B vs Vercel Sandbox head-to-head on HMR-through-iframe is the test to run.

## Unresolved: element selection (sub-question C)

The "point at a DOM node, feed source context to the agent" tooling did not produce any claims that survived verification, so there is no evidence-backed recommendation yet. The searches surfaced two candidates worth a dedicated pass:

- Onlook: instruments the served bundle with `data-oid` attributes at build time (a Babel/SWC plugin); selecting a DOM node in the preview reads the oid and maps it back to the exact source location. Most directly forkable mechanism seen, and it aligns with the Agentation approach in [5-architecture.md](./5-architecture.md).
- stagewise: a browser toolbar approach (`@stagewise/toolbar`).

Neither is backed by verified evidence here. This needs its own verification pass focused on what works inside a cross-origin preview iframe and feeds DOM-to-source context to the Claude Agent SDK. It is separable from the HMR spike above.

## Build order

1. Spike the HMR-through-iframe assumption. Nothing else starts until it is green.
2. Fork the template, lock the connected repo to our Next.js template, confirm Claude Agent SDK runs in the sandbox.
3. Build the exposed `next dev` preview path and the workspace iframe.
4. Add the PR-creation step after push.
5. Wire `DATABASE_URL` and migrations; decide per-session DB isolation.
6. Resolve element selection (separate research pass), then add it.

## Source quality

Strong: overwhelmingly primary vendor docs and official repos. Confidence on the sandbox choice (A) and the fork base (B) is high. The weakness is breadth, not depth: several named candidates were under-researched, and the assembled glue plan and the HMR-through-iframe assumption are unverified end to end. Treat the spike as mandatory, not optional.
