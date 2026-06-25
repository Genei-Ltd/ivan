---
name: Create Demo Fork
description: Pre-create (or clean up) the pre-warmed Aiven Postgres fork for Ivan's demo mode. Use when the user wants to mint a coffee-database-demo-fork before a demo, or find stray throwaway forks to terminate. A real fork takes ~5 minutes, so it must exist before the demo, not during it.
---

# Create Demo Fork

Ivan's demo mode (see `src/lib/shell/demo.ts`) cannot fork live on stage: a real
Aiven fork takes about five minutes and the demo is four. So we pre-warm one
fork and point the session at it via `IVAN_DEMO_FORK_URL`. This skill creates
that fork and helps clean up the throwaway forks the in-sandbox agent makes
during a run.

Connection-string note: this session's Aiven MCP connector is secrets-redacted
(`service_uri` comes back as `[REDACTED]`). The skill can create and poll the
fork, but the user copies the connection string from the Aiven Console (Service
overview > Connection information) into `IVAN_DEMO_FORK_URL`.

## Defaults (override if the user says otherwise)

- Project: `coloop`
- Source production service: `northbound-coffee-prod` (Postgres, tagged
  `purpose: production`)
- Fork name: `coffee-database-demo-fork-<N>`, N starting at 1 (next free integer)
- Cloud: same as the source (`do-fra`) unless the user wants a cross-cloud fork
- Plan: the smallest **paid** Postgres plan in the chosen cloud. Never a free
  tier, the fork should behave like production.

## Create the fork

1. Confirm the source. `aiven_service_list` with `service_type: pg` in the
   project; confirm `northbound-coffee-prod` exists and is `RUNNING`. If more
   than one plausible production service exists, ask which to fork.
2. Check it is fork-able. `aiven_service_get` on the source; confirm it has at
   least one entry in `backups` (a fork is a copy from a backup / PITR point). If
   there are none, stop and say so, there is nothing to fork from yet. Note: the
   source is on a free plan; if the create call is rejected because free-tier
   sources cannot be forked, report that to the user rather than guessing a fix.
3. Pick the next index. `aiven_service_list` with `search: demo-fork`; use the
   highest existing `coffee-database-demo-fork-<N>` plus one.
4. Pick the plan. `aiven_service_type_plans` for `pg` in the project, keep only
   plans available in the target cloud, drop free tiers, choose the cheapest
   remaining (confirm with `aiven_service_plan_pricing` if unsure). Show the
   user the plan and price before creating.
5. Create it. `aiven_service_create`:
   - `service_type: pg`
   - `service_name: coffee-database-demo-fork-<N>`
   - `cloud`: the source cloud (or the user's choice)
   - `plan`: the chosen paid plan
   - `user_config.service_to_fork_from`: the source service name
   - `user_config.project_to_fork_from`: the project
   - `user_config.recovery_target_time`: only if the user wants a specific PITR
     point; otherwise omit to fork the latest backup.
6. Wait for ready. Poll `aiven_service_get` until `state` is `RUNNING`. This
   takes minutes; poll a few times with a pause between, do not hammer it. If it
   is still `REBUILDING` after several checks, tell the user it is still coming
   up and they can re-check, do not loop forever.
7. Hand off the fork. Demo mode needs two values in Ivan's `.env`, set together:
   - `IVAN_DEMO_FORK_NAME` = the fork's service name (e.g.
     `coffee-database-demo-fork-1`), used by the proxy to redirect the agent's
     by-name MCP calls. You know this already, it is the name you created.
   - `IVAN_DEMO_FORK_URL` = the fork's Postgres connection URI, used by the
     preview app. The MCP redacts secrets, so tell the user to open the new
     service in the Aiven Console and copy the `postgres://...` URI.
   - Optionally `IVAN_DEMO_FORK_PROJECT` (defaults to `coloop`).
     Remind them: setting these turns demo mode on, and the env schema requires
     URL and NAME together.

## Clean up throwaway forks

During a demo the in-sandbox agent makes a _real_ fork call each run (so the
audience sees it), then Ivan points the session at the pre-warmed fork instead.
Those throwaway forks pile up and cost money.

1. List candidates. `aiven_service_list` with `service_type: pg`. For each,
   `aiven_service_get` and read `user_config.service_to_fork_from`.
2. A service is a throwaway if it was forked from `northbound-coffee-prod`, its
   name does not match `coffee-database-demo-fork-*`, and it is not the prod
   service itself. List these clearly.
3. The Aiven MCP in this session has no delete/terminate tool, so output the
   exact terminate commands for the user to run, do not claim to have deleted
   anything:
   `avn service terminate --project coloop <service_name>`
   (or delete from the Console). Never terminate the `coffee-database-demo-fork-*`
   fork or the prod service.

## Report

For a create: the fork name, source, cloud, plan and price, current state, and
the reminder to set `IVAN_DEMO_FORK_NAME` + `IVAN_DEMO_FORK_URL`. For a cleanup:
the stray forks found
and the terminate commands to run.
