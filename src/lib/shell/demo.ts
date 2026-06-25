import { getEnv } from '@/lib/env'

// Demo mode for live demos. A real Aiven fork takes ~5 minutes, longer than a
// 4-minute demo, so we cannot fork on stage. Instead we pre-warm a fork (see the
// create-demo-fork skill) and make the whole session resolve to it:
//
//  - the preview app reads the fork via DATABASE_URL (demoForkUrl), and
//  - the agent's Aiven MCP calls are redirected onto the fork by the proxy,
//    keyed on the fork's service name/project (demoForkName/demoForkProject).
//
// The agent still issues a real fork call (the audience sees it), but its
// data/credential calls land on the already-live fork. The swap is invisible to
// the agent: it just creates and uses "its" fork, which is always ready.

// Demo mode is implicit: it is "on" whenever a pre-warmed fork is configured.
// The env schema guarantees URL and NAME are set together, so the call sites
// just read whichever they need (URL for the preview app, NAME for the proxy).

// The fork's Postgres connection string, used as the preview app's DATABASE_URL.
export function demoForkUrl(): string | undefined {
  return getEnv().IVAN_DEMO_FORK_URL
}

// The fork's Aiven service name, used by the proxy to redirect the agent's
// by-name MCP calls onto it.
export function demoForkName(): string | undefined {
  return getEnv().IVAN_DEMO_FORK_NAME
}

export function demoForkProject(): string {
  return getEnv().IVAN_DEMO_FORK_PROJECT
}

// When true, the proxy fakes the fork-create response instead of creating a real
// throwaway service.
export function demoFakeCreate(): boolean {
  return getEnv().IVAN_DEMO_FAKE_CREATE === 'true'
}
