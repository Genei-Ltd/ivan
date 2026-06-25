# Lovable shell: build plan

Concrete plan for the shell defined in [6-shell-research.md](./6-shell-research.md). Goal: a repo-connected, agent-driven editor with a live hot-reload preview that ends in a PR. Tracer-bullet phases, cut from the back, each independently demoable. The Aiven data layer ([5-architecture.md](./5-architecture.md)) bolts on at Phase 4 and is not a prerequisite for Phases 0 to 3.

## Locked decisions

These are settled by the research. Do not relitigate mid-build.

- Base: fork `vercel-labs/coding-agent-template`.
- Sandbox: Vercel Sandbox (Firecracker microVM, AL2023, sudo, public per-port `sb-[id].vercel.run`).
- Agent: Claude Agent SDK / Claude Code CLI, hosted long-lived inside the sandbox.
- Preview: sandboxed `next dev` (Turbopack HMR) on an exposed port, rendered in an iframe. Not Vercel preview deploys.
- Target repo: our locked Next.js 16 / App Router / pnpm template, connected by URL.
- Control plane: the forked template app, deployed on Vercel.

## Architecture in one paragraph

The forked template is the control plane (Next.js on Vercel). A session spawns a Vercel Sandbox, clones the target repo on a fresh branch, installs deps, and starts two long-lived processes: `next dev` on an exposed port, and the Claude Agent SDK. The browser workspace shows chat on one side and an iframe pointed at the sandbox's public dev-server URL on the other. The agent edits files on disk; Turbopack HMR pushes the change into the iframe with no redeploy. On submit, the branch is pushed and a PR is opened against the same repo. `DATABASE_URL` is injected into the sandbox so full-stack changes and migrations run against a real Postgres.

## Inverted from the template

The template runs the dev server in the background and tells the agent not to touch it. We invert this: the platform owns the dev server and exposes it; the agent only edits files. This is the core change that turns a one-shot task tool into a live editor.

## Phase 0: HMR-through-iframe spike (mandatory gate)

Nothing else starts until this is green. This is the one unverified, load-bearing assumption.

- [ ] Fork the template, deploy the control plane to Vercel.
- [ ] Spawn a Vercel Sandbox, clone our Next.js template, `pnpm install`.
- [ ] Run `next dev --hostname 0.0.0.0 --port 3000`; set `allowedDevOrigins` for the sandbox host.
- [ ] Expose port 3000, get the `sb-[id].vercel.run` URL.
- [ ] Load that URL in a cross-origin iframe in a throwaway page.
- [ ] Edit a file in the sandbox, confirm HMR fires inside the iframe (no full reload, WebSocket upgrade survives the proxy hop).

Acceptance: a file edit in the sandbox visibly hot-reloads inside the iframe within a couple of seconds. If the WebSocket fails, try same-origin proxying or a reverse-proxy on the control plane before abandoning the approach.

## Phase 1: Spine (repo to agent to commit)

Mostly inherited from the template. Goal: prove the agent edits our repo in a sandbox and pushes a branch.

- [ ] Lock the connected repo to our Next.js template (hardcode or constrain the repo input).
- [ ] Confirm the Claude Agent SDK / Claude Code CLI runs in the sandbox with `ANTHROPIC_API_KEY` and edits files.
- [ ] Confirm branch-per-session, commit, push all work (template provides this).
- [ ] Stream agent tool calls and text to the workspace UI.

Acceptance: type a task, watch the agent edit files, see a pushed branch with the change. This is a demo on its own.

## Phase 2: Live preview (the core build)

Goal: the agent's edits appear live in the workspace.

- [ ] On session start, also boot `next dev` on an exposed port (Phase 0 mechanics).
- [ ] Render the workspace as chat plus an iframe pointed at the dev-server URL.
- [ ] Ensure the agent edits files but does not start its own dev server (override the template's AGENTS.md guidance).
- [ ] Add auth on the exposed preview port (basic auth or a signed token in middleware), since `sb-[id].vercel.run` is public.
- [ ] Handle the dev-server-crashed case: if the agent breaks the build, surface the error in the workspace, do not leave a blank iframe.

Acceptance: a chat instruction edits the app and the iframe updates via HMR without a redeploy. The preview is not publicly browsable without the token.

## Phase 3: Ship (PR creation)

Goal: close the loop back to GitHub.

- [ ] Add a "submit" action that triggers PR creation after the branch is pushed.
- [ ] Open the PR via the GitHub API / `gh pr create`, base = main, head = session branch.
- [ ] PR body: task summary plus the diff. Use the per-user GitHub OAuth token the template already wires.
- [ ] Decide token hygiene: PR opened from the control plane (holds the token) rather than from inside the sandbox.

Acceptance: submit opens a real PR against the target repo with the agent's diff, ready for a developer to review and merge.

## Phase 4: Data layer (full-stack changes)

Goal: full-stack edits and migrations against a real Postgres. This is where the Aiven layer from [5-architecture.md](./5-architecture.md) attaches.

- [ ] Inject `DATABASE_URL` into the sandbox env.
- [ ] Confirm `psql` and the node DB client reach the external Postgres over TCP.
- [ ] Per-session DB isolation so concurrent sessions do not corrupt shared state: Neon branching now, Aiven fork for the demo.
- [ ] Run migrations from the sandbox; verify the preview reflects schema changes.
- [ ] Carry migrations into the PR so a reviewed migration is the promotion artifact.

Acceptance: a schema-changing task runs a migration on the session DB, the preview shows the result, and the migration lands in the PR.

## Phase 5: Element selection (deferred)

Not started until Phases 0 to 3 are green, and pending its own research pass (sub-question C in [6-shell-research.md](./6-shell-research.md)). Candidates: Onlook's `data-oid` build-time instrumentation, or stagewise's toolbar. Goal: point at a DOM node in the preview, feed source context to the agent.

## Risk register

- HMR through the public iframe (Phase 0): the one make-or-break unknown. Gated first.
- Public preview ports: mitigated by auth in Phase 2.
- Concurrent sessions sharing a DB: mitigated by per-session isolation in Phase 4.
- Vercel Sandbox limits move fast: re-check duration and port caps before committing; 24h on Pro is current.
- Agent breaks the build and blanks the preview: handled in Phase 2.

## Open decisions to align on

1. Where does the agent run, in-sandbox (fast, scoped secrets in sandbox) or in the control plane reaching into the sandbox (cleaner secrets, more glue)? Default: in-sandbox for build speed.
2. Per-session DB: Neon branching versus Aiven fork for the non-demo path.
3. Preview auth mechanism: basic auth versus signed token in middleware.
4. One target repo hardcoded, or a small allowlist.
5. Session concurrency target and whether we pre-warm sandboxes.
