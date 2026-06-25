---
name: DB Change
description: Use when a user asks Ivan for functionality that may need database schema, migration, seed data, enum, reference table, index, constraint, or data backfill changes. Examples include adding selectable product attributes such as coffee grind type, storing new user preferences, adding statuses, adding relations, changing database-enforced validation, adding lookup data, or fixing data-dependent production behavior.
---

# DB Change

Use this skill for feature requests that may need durable data changes. The goal is to make the app change and prove the migration against production-like Aiven data without mutating production.

## Procedure

1. Inspect the target repo before deciding the schema design. Identify the ORM, migration system, seed mechanism, validation layer, and how similar domain values are modeled.
2. Prefer the repo's established pattern. For selectable domain values, use a lookup/reference table when values may need display labels, sort order, localization, active/inactive state, or later management. Use an enum or check constraint only when the set is clearly stable and the repo already uses that style.
3. Before writing migrations or running data-changing commands, create or select a production-like Aiven PostgreSQL fork. Use Aiven MCP discovery to list projects and services, identify the source PostgreSQL service, and confirm the source if more than one plausible production service exists.
4. Treat Aiven service forking as the normal path, not an empty logical clone. Create the fork through the service-create tool using service type `pg` and `user_config.service_to_fork_from`. Include `user_config.project_to_fork_from` for cross-project forks and `user_config.recovery_target_time` only when a specific PITR point is required.
5. Keep the fork in the same cloud/project unless the user asks otherwise. Choose the smallest paid plan that supports forking and the expected workload rather than a free-tier or unsupported hobby plan.
6. Do not mutate production. Direct all migration runs, SQL writes, seed writes, backfills, and validation queries that can change state at the fork. Production reads are allowed for discovery. Production writes require the user to explicitly ask for production execution and confirm the exact project, service, command or SQL, backup state, expected impact, and rollback or roll-forward plan.
7. Retrieve or use connection details only when needed to operate against the fork or inspect production metadata. Do not print passwords, full connection strings, tokens, or certificates into chat unless the user explicitly asks for them. Prefer local environment variables, ignored files, or MCP SQL tools. Redact secrets in summaries and logs.
8. Implement the schema change as a real repo migration, not throwaway DDL. Include model/schema updates, application code, validation, tests, and seed or backfill logic. For non-null additions, prefer expand-and-contract: add nullable/defaulted field, backfill existing rows, then add strict constraints when needed.
9. Add indexes only for concrete query paths, uniqueness, foreign keys, or performance findings.
10. Run the migration against the fork and validate with production-like data. Check migration output, schema shape, seed rows, affected row counts, representative app flows, and relevant queries. Use `EXPLAIN` or query statistics when the change affects filtering, joins, uniqueness, or performance.
11. If the migration fails, fix it and rerun from a clean fork state when practical. If the fork is contaminated, create a fresh fork or clearly state the uncertainty.
12. When finished, report the migration files and app files changed, source service and fork service names, validation commands and SQL checks run, production-data assumptions found, whether production rollout needs a maintenance window or batching, and whether the fork still needs cleanup.
13. Ask whether to delete or power off the fork if the available Aiven tools support cleanup. Never silently leave a paid fork running without mentioning it.
