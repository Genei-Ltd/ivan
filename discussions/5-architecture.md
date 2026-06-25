# Architecture and technical design

The runtime system behind the concept in [4-concept.md](./4-concept.md). This is the thing you wrap an app with, the button, the agent, the containers, the data forks, and how a non-engineer drives all of it through the Aiven MCP. Written demo-first: every load-bearing latency is hidden behind a warm pool, and what is underneath is real.

Codename for the runtime: Ivan. The CLI/onboarding half is Aivenify. The demo app is Northbound Coffee.

## 1. What we are building, in one paragraph

A React provider you wrap any app with renders a floating button. Clicking it gives the user a private, full-data copy of production they can talk to in plain English. Behind the button, an orchestrator pairs a pre-warmed compute sandbox (the app running in dev watch mode) with a pre-warmed data fork (a real Aiven Postgres cloned from prod), drops a coding agent into the sandbox, and streams the agent's work back to the browser. The agent edits code (hot-reload makes it visible instantly), operates the Aiven data platform through the MCP (fork, provision services, change schema, write context comments), and when the user is happy, opens a PR that triggers a real preview deployment. Many of these run in parallel, one per person and one per agent.

## 2. The mental model: two warm pools, paired per session

The whole design hangs off one idea. Nothing slow happens during the demo, because the two slow things are pre-made:

- Compute pool: N sandboxes, each with the repo cloned, dependencies installed, and `next dev` already running on a public URL.
- Data pool: N Aiven Postgres forks of production, already spun up and seeded, sitting warm.

A session is the act of pairing one warm sandbox with one warm fork, pointing the sandbox's `DATABASE_URL` at the fork, and attaching an agent. That pairing is instant. Everything the audience sees as "it just forked production and started working" is a pairing of two things that were quietly made minutes earlier. Stan explicitly told us to do this.

This is also why multiplexing is free: a fleet is just many pairs.

## 3. Components

### A. The embedded SDK (`@ivan/provider`)

A small React package. Three responsibilities, switched by mode:

- Host mode (default): renders the floating button (`position: fixed`, bottom-right) over the host app. This is the "wrap your app, get a button" piece. `<AivenProvider config={{ backendUrl, repo, appId }}>{children}</AivenProvider>`.
- Workspace mode: when the button is clicked, the provider opens a full-screen overlay (React portal) containing three panes: a chat/voice input, a live preview iframe pointed at the paired sandbox URL, and an activity log that renders the agent's tool calls (especially MCP calls, which are the wow). All of this is in the SDK so it travels with any wrapped app.
- Bridge mode: when the provider detects it is running inside the preview iframe (URL flag `?__ivan=bridge`), it does not render the button. Instead it mounts Agentation (`npm install agentation`, "Visual feedback. For agents."), the off-the-shelf package that does exactly this: hover-highlight a DOM node, click to annotate, and it emits structured context (CSS selector, source file path, React component tree, computed styles) for the agent. Agentation ships its own MCP, so the agent reads the annotation over MCP rather than us hand-rolling a source-stamping plugin and a `postMessage` relay. This is how a non-engineer points at a thing instead of describing it.

The SDK talks to the orchestrator over one WebSocket per session: user messages and element selections go up, agent events (text, tool calls, status, preview-ready) come down.

Critical note on origins: the preview iframe is same-origin with its own dev server, so Next/Turbopack HMR (which uses a WebSocket back to the dev server) works untouched. Element selection happens inside the iframe (Agentation runs in the forked app) and reaches the agent through Agentation's MCP, so we avoid cross-origin DOM access from the parent entirely. The thing to confirm is that Agentation's toolbar behaves when the app is rendered inside our workspace iframe rather than a top-level tab.

### B. The orchestrator (control plane)

A small long-lived Node service (not Next route handlers, because we need durable WebSockets and process control). Responsibilities:

- Pool management: keep the compute and data pools topped up; assign and reclaim.
- Session lifecycle: `POST /sessions` pairs sandbox + fork, injects env, starts the agent, returns `{ sessionId, previewUrl, wsUrl }`. `DELETE /sessions/:id` tears down.
- Brokering: proxy the browser WebSocket to the agent process in the sandbox, and relay streamed events back.
- Promotion: `POST /sessions/:id/submit` pushes the branch, opens the PR, and (post-merge) runs the migration against prod.
- Fleet: `GET /fleet` lists active sessions for the grid.

The orchestrator holds the sensitive credentials (prod Aiven token, GitHub token, Vercel is not needed, see F). Sandboxes only ever receive fork-scoped secrets.

### C. The agent harness

Recommendation: the Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`, the headless Claude Code engine), running inside the sandbox.

Why this and not "clone an open-source harness" or Codex:

- It supports MCP natively (stdio, SSE, HTTP servers configured per session), which is the entire Aiven requirement. We do not have to build or patch MCP support into someone else's harness, which is the risk you flagged.
- Its built-in tools (Read, Edit, Bash, Glob, Grep) already do exactly what we need: edit the repo on disk so HMR fires, run `git`, run `psql`, run the migrate script. No custom file-IO layer.
- It is the Anthropic track. Using it is the literal "ship a working agent" deliverable, so one build serves two prizes.
- Streaming message events (assistant text, `tool_use`, `tool_result`) map directly onto the activity log we want to show.

Codex and OpenHands are the fallbacks if we ever want a non-Anthropic harness, but they cost us MCP maturity and the Anthropic prize, so they are not the call here.

Where the agent runs is a real decision:

- Option 1 (recommended for the hackathon): agent runs inside the sandbox. Native tools operate on the local repo, the dev server is localhost, the local Aiven MCP runs alongside. Cost: scoped secrets (Anthropic key, fork-scoped Aiven token, no prod, no GitHub) live in the sandbox. Acceptable for throwaway demo infra.
- Option 2 (productionisation): agent runs in the orchestrator and reaches into the sandbox via the sandbox SDK (write files, run commands). Secrets stay out of the sandbox. More glue, slower to build. Note it, do not build it now.

Aiven MCP wiring in the sandbox: use the local server, not the hosted one, because the hosted server needs interactive OAuth which is impossible headless. Per the docs:

```bash
claude mcp add --scope user aiven-mcp \
  -e AIVEN_TOKEN=<fork-scoped-token> \
  -e AIVEN_READ_ONLY=false \
  -- npx -y mcp-aiven
```

Connection-credential exposure (`allow_secrets`) is enabled only for fork services, never prod, matching Aiven's own guidance that this is a dev-only setting.

The sandbox agent runs two MCP servers: Aiven for the data platform, and Agentation for "point at this element" (it carries the selector, source file, and component tree into the agent's context). Confirm whether Agentation's MCP is a local stdio server we bake into the sandbox image or a hosted endpoint, since that decides the wiring.

The agent's system prompt encodes the product's opinions and, deliberately, Stan's preferences:

- You operate on a fork of production. You can break anything.
- Schema changes are always written as a migration file, applied to the fork to test, never as throwaway DDL. Every migration includes `COMMENT ON` statements recording why the change exists, who asked, and the PR link.
- Decide per change: a copy/content tweak can be promoted straight to prod on merge; a schema change or a new service is promoted via migration after review. (Stan's move-fast-don't-break-things rule.)
- For analytics, provision a ClickHouse service through the MCP and wire it in.
- When done, commit on the session branch and signal ready.

### D. The execution sandbox (dev container with HMR)

Each sandbox is a Linux container that runs the app in watch mode and exposes it publicly. Requirements: fast warm start, a public HTTPS URL per sandbox that proxies WebSockets (for HMR), filesystem and process access for the agent, and a baked image so dependencies are not installed live.

Provider options, behind a `SandboxProvider` interface so it is swappable:

- E2B (recommended): sandboxes purpose-built for agent code execution. Custom template (Dockerfile) prebakes Node, repo deps, the Claude Agent SDK, `mcp-aiven`, and `psql`. `getHost(3000)` yields the public URL for the iframe. Fastest path, least glue.
- Fly Machines: prebuilt image, Machines API to boot, `.fly.dev` URL per machine, WebSocket-friendly. More control, more setup.
- Self-hosted (their Hetzner box plus Docker plus Caddy): `docker run` per session, Caddy wildcard reverse proxy `*.ivan.live` to the container with automatic TLS. Most control, most glue.

Next dev specifics behind a proxy: bind `next dev --hostname 0.0.0.0`, set `allowedDevOrigins` for the sandbox host so HMR is accepted, and confirm Turbopack HMR survives the public-URL hop (it does, same-origin). The agent editing a file triggers HMR and the iframe updates with no redeploy. That instant visibility is the core trick, and it is exactly why we are not using Vercel preview deployments for the editing loop.

### E. The data layer (Aiven, through the MCP)

Everything the user "does" to data is the agent calling the MCP from natural language. Concretely:

- Fork production. Mechanically this is a service create with `service_to_fork_from` in `user_config` (forks from the latest backup or a PITR point). Real forks take five to six minutes, so we hide that behind a `ForkProvider` abstraction:
  - WarmPoolFork (recommended): keep N real Aiven forks warm; assign instantly; replenish in the background. Real Aiven services, zero perceived latency. This is the "fake fork" you asked for, and it is honest because the forks are genuine.
  - RealAivenFork: the live MCP/API call, used to replenish the pool and shown on screen for narrative.
  - SnapshotFork: a seeded local Postgres, last-resort fallback if Aiven forking misbehaves, least Aiven-aligned so avoid.
  - Prerequisite: source prod has PITR on and at least one backup, or there is nothing to fork. Service integrations do not copy to a fork, so read metrics through the MCP at the service level, not via a copied Grafana wiring.
- Spin up new services. ClickHouse for analytics, Kafka for the email gag (Kafka is not forkable, so it is always provisioned fresh). Both via MCP create. Pre-warm one of each for the demo; the create call still fires on screen.
- Make schema changes. The agent gets the fork's connection string via the MCP (`allow_secrets`, fork only), connects with `psql`, and applies the migration it just wrote.
- Add context comments. `COMMENT ON TABLE/COLUMN/INDEX ... IS '...'` inside the migration. This is Stan's context layer. A small "context panel" in the app reads these back so the data visibly documents itself, which doubles as the answer surface for the "what does this do / are there events here" questions the commercial team asks.

The debug beat is concrete and uses Aiven's own grain: enable `pg_stat_statements`, sort by `mean_exec_time` or `total_exec_time` to find the slow checkout query, `EXPLAIN ANALYZE` to confirm the sequential scan, add the index in a migration, re-measure on the fork's real-scale data. Aiven ships an AI Database Optimizer that surfaces the same recommendation, so we can say we are automating a workflow they already sell.

The slow bug must live in the database (missing index, seq scan, or N+1), not a frontend `setTimeout`, or there is nothing for telemetry to find. On the $5 dev Postgres a seq scan over a few hundred thousand seeded rows is genuinely slow, which is helpful: cheap tier makes the bug visible.

### F. Git, PR, and the preview deployment

- The sandbox has the repo on a session branch (`ivan/<slug>`). The agent commits there.
- On submit, the branch is pushed and a PR opened. For secret hygiene, do the push and PR from the orchestrator (which holds the GitHub token) by pulling the branch/patch out of the sandbox, rather than putting a GitHub token in the sandbox. Hackathon shortcut if needed: a narrowly scoped token in the sandbox and `gh pr create`.
- The PR triggers a real Vercel preview deployment through Vercel's existing GitHub integration. This is the only place Vercel is used, and it matches your instruction: containerised HMR while building, a durable preview only once a PR exists. The agent does not need to know about Vercel; the GitHub-to-Vercel integration handles it.
- The preview's `DATABASE_URL` (Vercel preview-scoped env) points at the retained fork so reviewers see the same state. Keep the fork alive until merge.
- PR body assembles the proof: the diff, the migration SQL with its context comments, before/after latency numbers, a summary of Aiven changes, and an ElevenLabs voice note.

On merge: promotion. Copy changes are already in the code. Schema changes run as the migration against prod, executed by the orchestrator or CI with a separate prod-scoped credential, never by the in-sandbox agent. The `COMMENT ON` statements ride along, so prod's schema inherits the context. New services are created in prod via MCP at this step.

### G. Fleet multiplexing

A fleet is many sessions at once. `GET /fleet` returns active sessions; the grid renders a tile per session (persona, current action, a thumbnail; click to go live in that workspace). The agent swarm tile is one parent agent that asks the orchestrator for several child sessions, each its own sandbox-plus-fork pair, working a backlog in parallel. Pre-warm the whole fleet before going on stage. Small forks on the $5 tier are cheap and we tear them down after. Because the tiles are independent, any one can be skipped if it misbehaves, which is the real reason multiplexing de-risks the demo.

### H. Voice (ElevenLabs)

Two touch points, both cheap. The user can speak requests (speech-to-text in) and the PR carries a generated voice note from the persona (text-to-speech out). Pre-generate the demo voice note so it is instant. This auto-enters the ElevenLabs track.

## 4. The golden path, end to end

1. Northbound Coffee renders, wrapped in `<AivenProvider>`. The button sits bottom-right.
2. Riku clicks it. The SDK calls `POST /sessions`.
3. The orchestrator pairs a warm sandbox with a warm fork, sets the sandbox `DATABASE_URL` to the fork, starts the agent with the Aiven MCP wired in, and returns `previewUrl` and `wsUrl`.
4. The workspace overlay opens: chat on the left, the live forked app (iframe to `previewUrl`) on the right, an empty activity log.
5. Riku says "make the hero say X and add a discount banner". The agent edits the files. HMR updates the iframe in place. Activity log shows the edits.
6. Riku says "checkout is slow, find out why and fix it". Activity log streams MCP calls: read metrics, read logs, fetch fork credentials. The agent runs `pg_stat_statements` and `EXPLAIN ANALYZE`, writes a migration that adds the index plus `COMMENT ON`, applies it to the fork, and re-measures. The context panel updates.
7. Riku says "add an admin sales dashboard". The agent provisions a ClickHouse service via MCP, wires it, and a live view appears.
8. Riku hits submit. The branch is pushed, a PR opens with the diff, migration, latency delta, and voice note. Vercel builds a preview against the retained fork.
9. A developer merges. The orchestrator runs the migration against prod and creates the ClickHouse service in prod via MCP. The fork and sandbox are reclaimed.
10. Cut to the fleet: several of these running at once, including the swarm.

## 5. Key decisions and the critical reasoning

- Claude Agent SDK over cloning a harness or Codex: native MCP, native file/git/bash tools, and it is the Anthropic deliverable. Removes the single biggest "does it even support MCP" risk you raised.
- Sandboxes with HMR over Vercel preview for editing: instant visibility without redeploy is the whole point; Vercel preview is reserved for the durable post-PR artifact, exactly as you said.
- Warm pools over live creation: the only way the five-to-six-minute fork and the multi-minute service creates do not wreck a live demo. Sanctioned by Stan.
- Local MCP in the sandbox over hosted: hosted needs interactive OAuth, impossible headless; local takes a scoped token.
- Migrations as the promotion mechanism over ad-hoc DDL: keeps the fork's schema equal to what the repo claims, makes prod promotion a single reviewed artifact, and carries the context comments to prod. Without this, the fork and the codebase silently diverge.
- Credential isolation: prod token and GitHub token in the orchestrator; only fork-scoped secrets in the sandbox; prod schema promotion in CI. This is the answer to "isn't letting an agent touch prod terrifying": it never touches prod, it touches a fork, and only a reviewed migration reaches prod. It also matches Aiven's shared-responsibility guidance, which Stan's docs lean on.
- `ForkProvider` / `SandboxProvider` interfaces: so "fake fork" versus real, and E2B versus Fly versus self-host, are swappable without touching the rest.
- Agentation over a hand-rolled selection bridge: it already does element-to-source annotation and exposes it over MCP, so we drop the SWC source-stamping plugin and the `postMessage` relay and just wire its MCP next to Aiven's. Licensing note: free for internal/team use, commercial licensing for redistribution, which only matters if Ivan ships as a product, not for the hackathon.

## 6. State model (orchestrator)

- Session: `id`, `status` (warming, active, submitting, promoting, done), `branch`, `forkId`, `sandboxId`, `previewUrl`, `persona`, `repo`, `transcript`.
- ForkPool entry: `id`, `aivenServiceName`, `host`, `creds` (fork-scoped), `state` (warm, assigned, dirty, reclaiming).
- SandboxPool entry: `id`, `provider`, `host`, `state`, `devServerReady`.
- Fleet: derived list of active sessions for the grid.

## 7. Real versus faked (demo integrity)

Real: the fork (a genuine Aiven Postgres), the telemetry reads, the schema migration and its comments, the ClickHouse provision, the code edits and HMR, the PR and preview, the prod promotion on merge.

Faked or pre-staged: the latency (warm pools), the seeded "production" data (a faker row-writer), the pre-generated voice note, the rehearsed prompts for timing, and a recorded full run as fallback. We never fake an MCP call; we only hide how long real things take.

## 8. Load-bearing risks, in the order to validate them

1. Can the MCP actually create a fork (`service_to_fork_from`) with write mode and secrets on? If not, fall back to the agent calling the Aiven API/CLI for the fork step and the MCP for everything else. Validate first; the spine depends on it.
2. Can an E2B (or Fly) sandbox run `next dev`, expose a public URL with working HMR through an iframe, run the Claude Agent SDK, and reach the local Aiven MCP, all at once? Build a single end-to-end spike before anything pretty.
3. Is the slow bug DB-observable? Read the current code, confirm it is a real query problem, reshape if needed while keeping it deliberate.
4. Does HMR survive the proxy hop with `allowedDevOrigins` set? Confirm in the spike.
5. Fork prerequisites: PITR on, a backup present, integrations not relied upon to copy.

## 9. Build plan (tracer-bullet, cut from the back)

- Phase 0: the two spikes in risks 1 and 2. Nothing else starts until both are green.
- Phase 1 (spine): button to orchestrator to warm pair to workspace; agent edits a file; HMR shows it live. This alone is a demo.
- Phase 2 (data beat): debug slow query via MCP, migration plus `COMMENT ON`, re-measure, context panel.
- Phase 3 (ship): commit, push, PR with proof, Vercel preview, voice note, prod promotion on merge.
- Phase 4 (breadth): ClickHouse from chat, Agentation visual feedback, fleet view with pre-warmed sessions, swarm tile.

Each phase is independently demoable, so if we run out of time we present the last green phase.

## 10. Cost, teardown, limits

- Optimise for the $5 Postgres and a small ClickHouse. Keep pools tiny (two or three).
- Reclaim forks and sandboxes on session end; tear the whole fleet down after the demo.
- Unique Aiven service names per session (`ivan-<sessionId>`) to avoid collisions; the orchestrator deletes them on teardown.
- Concurrency capped by pool size; the fleet is pre-provisioned, not elastic, for the demo.

## 11. Open decisions

1. Sandbox provider: E2B (fastest), Fly Machines, or self-host on Hetzner with Caddy?
2. Agent location: in-sandbox (fast, recommended) or in-orchestrator (clean secrets, slower to build)?
3. Migration tooling: plain SQL files (most visible in the PR, best for the context-comment story) or Drizzle/Prisma (typed, more setup)?
4. Agentation: confirm its toolbar works inside our preview iframe, and whether its MCP is local (bake into the sandbox image) or hosted (wire as a remote MCP).
5. Fork strategy on stage: pure warm-pool reveal, or fire a real MCP fork on screen and cut to the warm one while it spins?
6. Fleet size and tile personas (analytics, support-repro, copy edit, swarm).
