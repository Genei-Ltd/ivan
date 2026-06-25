# Concept and demo (refined)

Demo-first spec for the Aiven track. Work backwards from the demo in section 6. Principles: wow factor, funny, aligned to Aiven's judging criteria (MCP integration depth, workflow autonomy, creativity).

## Thesis

Production is scary because nobody knows what is safe to touch. We make production forkable and self-documenting, so an agent driven by anyone can change it safely and prove it works, and every change makes production more legible instead of less.

The fork is the safety mechanism. The self-documenting context layer is the durable artifact, and it is the thing Stan is most likely to champion in judging.

One-liner: give everyone on your team a disposable, full-data copy of production where an agent does the work and proves it before it ships. Powered by Aiven.

Spine (the narrative we tell): a non-engineer safely changes production end to end, driven by an agent, verified before it ships. Differentiator we foreground: the data layer accrues context as agents work it, so legibility compounds.

The agent is called Ivan (Aiven the Terrible: it touches production without fear because everything is forked). Demo product is Northbound Coffee, an e-commerce site with a deliberate slow-checkout bug.

Forks are cheap and run in parallel, so this is not one preview environment, it is one per person and one per agent. Many full-data copies of production at once, each isolated, none able to hurt a customer. That parallelism is the product thesis made literal, and in the demo it lets us multiplex: show many capabilities running side by side in the same wall-clock minute, and de-risk the whole thing because no beat depends on the previous one finishing.

## What the Aiven MCP actually is

The MCP is a control-plane operator plus a credential vault, not a SQL runner. Capability classes:

- Resource visibility: list projects, services, integrations; read a service's status, plan, region.
- Service lifecycle (write): create, update, delete services (Postgres, Kafka, etc.), change plans and config. Forking is a create with `service_to_fork_from` in `user_config`. Requires read-only mode off.
- Observability: read metrics, logs, and configuration to troubleshoot.
- Credentials: with `allow_secrets=true` it returns the actual Postgres and Kafka URIs, passwords and certs, so the agent connects directly and runs SQL itself. Dev-only per the docs.
- Docs Q&A: ask questions against Aiven's documentation.

So the loop is: MCP forks the service and hands over credentials, then the agent runs DDL directly on Postgres. The MCP does not run your queries for you.

Note: Aiven already ships AI Insights and a SQL Query Optimizer (the EverSQL acquisition) that recommends indexes for slow queries. Our debug beat automates a workflow they already sell. That is good. We build on their grain and say so.

## Assumptions from the ideation sessions that are wrong

Stop saying these on stage.

- Kafka is not forkable. Forkable services: ClickHouse, Grafana, Metrics, MySQL, OpenSearch, Postgres, Valkey. "The fork carries the Kafka messages" is false. Kafka gets provisioned fresh per environment.
- A fork is a copy from the latest backup or a PITR point. The source needs PITR on and at least one backup, or there is nothing recent to clone. Matters for pre-warming.
- Service integrations do not copy to a fork. Grafana or Datadog wiring will not follow. Read metrics via the MCP at the service level instead, which works regardless.
- Cross-cloud forking is native. You can fork a Postgres from a GCP source straight into an AWS region or a different plan. The "move it to AWS" beat is a legitimate built-in capability, not a hack, and it flatters the AWS sponsor for free.

## What Stan rewards

Stan Mitriev is Product Director for the context layer. In the feedback session, unprompted, he returned three times to one idea and said "for me it's cool": as the agent changes schemas, it writes the why of each change into the Postgres table and column comments, so the context lives inside the data. That is his job and his vote, not a side feature. It lands in Aiven's actual stack via DataHub (governance, lineage, documentation) and the Kafka Topic Catalog.

His other signals:

- Use the MCP a lot. Scoring is MCP integration depth, and he said "the more you use the MCP the better." A clean demo with three MCP touches under-scores the one axis that is explicitly weighted.
- Verified autonomy, not a PR bot. The demos that win are where the agent made real changes that actually work, versus "opens a PR that's sometimes bad."
- Let the agent decide fork-versus-prod by risk. Copy change goes straight to prod, schema change forks first. He proposed this himself.
- Cheap. Optimise for the $5 Postgres, simulate data with a row-writer.

Why the earlier cut was mid: it under-used the MCP, it treated the self-documenting context layer as a throwaway, and it ignored that Aiven's own AI Insights already does the slow-query-to-index trick. The refined version foregrounds the context layer and packs the demo with MCP calls.

## The demo, beat by beat

Total target three to three and a half minutes. One continuous take, pre-warmed and rehearsed, with a recorded fallback.

Cold open, 20s. Northbound Coffee, real orders in an Aiven Postgres. Meet Riku, our marketer, who cannot code, has Claude Code, and has been told to stop bothering engineering. Click checkout live, it hangs five seconds. Two requests queued from Riku: "checkout is slow, fix it" and "give me an admin sales dashboard."

Beat 1, fork production, 30s. Riku clicks one button. MCP call: create service with `service_to_fork_from`, PITR latest, into an AWS region. A real clone of prod, every order, appears behind a Vercel preview. Line: full copy of production, real data, now on AWS, Riku can drop every table and no customer feels a thing. Pre-warmed.

Beat 2, debug and self-document, fused, 75s. The centre. On the fork: "find why checkout is slow and fix it." Ivan, visibly chaining MCP calls: read metrics and logs, see the spike; pull credentials, connect, run `pg_stat_statements` and `EXPLAIN ANALYZE`, find the sequential scan or N+1; apply the migration on the fork; re-measure on real data, five seconds to 200ms. Then the Stan move: write the why into the schema with `COMMENT ON`, the rationale, who asked, the date, the PR link, and the app's context panel updates live to show the table narrating its own change history. Line: every change Ivan makes writes its reason back into the data layer, production gets more legible each time an agent touches it, and this is where Aiven's catalog and lineage pick it up. Hits autonomy and the context layer in one beat.

Beat 3, the fleet reveal, 50s. The punchline, and the product thesis made literal. Riku is not the only one. Cut to a grid of live forks of production running at once, each isolated, each on real data, none touching prod:

- one where Ivan provisions a ClickHouse service from "add an admin sales dashboard" and renders a live view (Stan's own trick, a second service type for breadth),
- one where a support rep reproduces a customer's bug on a clone of that customer's data, fixes it, and ships,
- one where a salesperson edits copy and leaves an ElevenLabs voice note,
- a swarm of sub-Ivans, each on its own fork, chewing through a backlog in parallel (the agent swarm Stan floated in the kickoff).

Narrate two tiles, let the rest play as ambient proof. Line: forking is cheap and parallel, so this is not one preview environment, it is one per person and one per agent, the whole company working on production at once, and nothing they do can touch a customer. Optional one-line Kafka gag if email is one of the tiles: a durable newsletter pipeline, good for a trillion signups, in case all of Finland subscribes at once.

Beat 4, ship, propagate, voice note, 35s. Riku hits submit. A PR opens with the diff, the migration with its comments, the before/after latency, and an ElevenLabs voice note from Riku. Dev merges. On merge, the agent applies the same index and provisions the same ClickHouse to real prod via MCP, deciding per change whether to go straight to prod or via a fork (Stan's move-fast-don't-break-things idea). Fork destroyed. Close: a marketer fixed a production performance bug, added analytics, and shipped it, in the browser, no terminal, no risk to real data. Ivan. Aiven the Terrible.

## MCP usage and criteria mapping

MCP calls on screen: multiple concurrent fork-creates (one per fleet tile), metrics, logs, credentials, ClickHouse create, prod promote, optionally Kafka create. A dozen or more distinct calls across three service types, many running in parallel. The fleet is the strongest single proof of MCP depth, because it is the platform being operated at scale from natural language.

- MCP integration depth: the calls above, across Postgres, ClickHouse, and optionally Kafka.
- Workflow autonomy: Beat 2 (diagnose, fix, verify) and Beat 4 (decide fork-versus-prod).
- Creativity: the self-documenting context layer plus a non-engineer operating production.
- Stan-specific: context-in-data as the centrepiece, decide-fork-vs-prod, cheap $5 Postgres and a small ClickHouse, cross-cloud fork that flatters AWS.

Cross-track coverage: the verified-agent loop also serves Anthropic's "ship a working agent" challenge, and the ElevenLabs voice note auto-enters that track.

## Load-bearing checks, before building anything

1. Can the hosted MCP actually create a fork? This holds up the whole spine. Connect Claude Code to the Aiven MCP over OAuth, write mode and secrets on, and try "fork my pg service" now. If it cannot pass `service_to_fork_from`, fall back to the agent calling the Aiven API or CLI directly with the token for the fork step, and the MCP for everything else.
2. Is the slow bug DB-observable? It must be a real Postgres problem (seq scan, missing index, N+1), not a frontend `setTimeout`, or Beat 2 has nothing for telemetry to find. Read the current code, confirm, and reshape if needed while keeping it deliberate.
3. Fork prerequisites: PITR on and at least one backup on the source, or the fork fails or lacks recent data.
4. Integrations do not copy to forks, so read metrics via the MCP at the service level rather than relying on a Grafana integration following the fork.

## Faking plan (Stan sanctioned this)

- Pre-warm the fork. Either reveal a fork created moments earlier, or kick a real one and cut to the warm one while it spins. The five-to-six-minute spin-up must not happen live.
- Pre-provision the entire fleet before going on stage. Each fork takes five to six minutes, so every tile must be warm and pre-seeded before the demo starts. Small forks on the $5 Postgres tier are cheap, and we tear the fleet down afterwards. Rehearse each tile so any one can be skipped if it misbehaves, which is the real reason multiplexing de-risks the demo.
- Pre-generate the ElevenLabs voice note so it is instant.
- Rehearse Beat 2 with a known-good prompt so the tool chain runs on rails for timing while staying genuinely agentic.
- Record a clean full run as the fallback. Always have the recording.
- What must be genuinely real: the fork, the telemetry read, the migration with comments, the ClickHouse provision, the prod promote. Fake only the latency and the staging.
- Simulate data with a row-writer on the $5 Postgres so the fork has realistic volume.

## Open decisions

1. Centrepiece weighting: foreground the context layer as the differentiator for Stan, with the non-engineer loop as the spine. Agree, or keep the context layer lighter?
2. Breadth beat: ClickHouse analytics (Stan's own trick, substantial, recommended) live, with Kafka email as an optional one-liner. Or swap to Kafka email live for the funnier gag?
3. Cross-cloud nod: keep the fork landing on AWS for free sponsor goodwill, or stay single-cloud for simplicity?
4. Fork on stage: pre-warmed reveal (safe) or live kickoff with a cut to the warm fork (riskier, more impressive)?
5. Fleet composition: how many forks in the grid (recommend four to five) and which personas and capabilities per tile (analytics, support-repro, copy edit, agent swarm)?
