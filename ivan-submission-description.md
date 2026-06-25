## Context

Ivan solves a real problem we have at our startup, and one many startups run into as soon as AI coding tools enter the workflow.

Our commercial team is close to customers. They know what needs to change: a broken flow, a slow page, a missing admin feature, a confusing product detail, a report they need, or a workflow that should exist. AI agents can now write a lot of the code for those changes. But in a real product, code is only part of the system.

Real apps depend on production data, schemas, queries, services, metrics, and edge cases that do not exist in a blank preview app.

## Problem

Today, non-engineers can ask an AI tool to make a change, but they usually cannot safely validate whether it works in the real product context.

That creates a gap:

- A feature may work on mock data but fail on production-shaped data.
- A fix may require understanding database behavior, slow queries, or service metrics.
- A schema change may look simple but break existing records.
- A commercial teammate may know the customer need, but still need an engineer to run the app, wire the data, test the change, and decide whether it is safe.

So the engineer remains the bottleneck, and the non-engineer still cannot confidently drive the change end to end.

## Solution

Ivan gives non-engineers a safe AI workspace for real product work.

Ivan lets non-engineers build, fix, and investigate on real production data without risking production.

For every request, Ivan creates an isolated environment with a live app preview, a sandboxed code workspace, and a full-data fork of production. The agent can make code changes, inspect the data layer, run migrations, check metrics, and validate the result against realistic state. Actual production is not mutated during exploration.

When the change is ready, Ivan opens a pull request for engineering review.

## How It Works

A user describes what they want in plain English.

Ivan starts a session, creates a branch, provisions a Vercel Sandbox, clones the target repo, installs dependencies, and starts the app in dev mode. The user sees a live preview in the browser while the agent works.

Ivan also connects the agent to Aiven through the Aiven MCP. This lets the agent inspect and operate the data layer: discover services, use production-like forks, retrieve connection details for safe environments, inspect metrics, and reason about database behavior.

The agent can then edit code, apply database changes to the fork, test the result, and show the updated app live. Once the user is happy, Ivan commits the changes, pushes the branch, and opens a pull request.

## Example Uses

A commercial teammate can ask Ivan to:

- Add a new product feature.
- Fix a production bug.
- Investigate why checkout or signup is slow.
- Inspect slow queries or database metrics.
- Add an admin dashboard.
- Change product copy or flows.
- Add schema changes and validate them against production-like data.
- Turn a customer request into a tested pull request.

## Outcome

Ivan lets startups move faster without removing engineering review or putting production at risk.

Commercial teams can drive more product work themselves. Engineers keep control of what ships. AI agents get the real context they need to make useful changes. Production remains protected because exploration happens on isolated forks, not on the live system.

The result is a safer workflow for AI-assisted product development: real data, real validation, real pull requests, and no direct risk to production.

## How We Built It

Ivan is built with Next.js, Vercel Sandbox, Aiven MCP, GitHub, and an AI coding agent running inside the sandbox.

The app provides the chat workspace, live preview, activity stream, and PR flow. Vercel Sandbox provides the isolated runtime where the target app runs and where the agent edits files. Aiven provides the production-like data layer and MCP interface. GitHub handles branches and pull requests.

We also built demo support for pre-warmed Aiven forks, because real production forks can take several minutes to create. This lets the demo stay fast while still using real Aiven-backed infrastructure.
