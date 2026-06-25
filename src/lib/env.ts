import { z } from 'zod'

// Validated lazily (inside request handlers), never at module load, so
// `next build` and the design-system pages don't need these set.

const schema = z.object({
  // The coding agent (Claude Code, headless) running inside the sandbox.
  ANTHROPIC_API_KEY: z.string().min(1),
  // Point the agent at Vercel AI Gateway by setting this to
  // https://ai-gateway.vercel.sh (then ANTHROPIC_API_KEY is your gateway key).
  ANTHROPIC_BASE_URL: z.url().optional(),
  AGENT_MODEL: z.string().min(1).default('claude-sonnet-4-5'),

  // The locked template repo the shell edits, as a git URL.
  TARGET_REPO_URL: z.url(),
  TARGET_REPO_BRANCH: z.string().min(1).default('main'),

  // Used to clone (if private), push the session branch, and open the PR.
  GITHUB_TOKEN: z.string().min(1),

  // Vercel Sandbox credentials.
  SANDBOX_VERCEL_TEAM_ID: z.string().min(1),
  SANDBOX_VERCEL_PROJECT_ID: z.string().min(1),
  SANDBOX_VERCEL_TOKEN: z.string().min(1),

  // Injected into the sandbox so full-stack changes and migrations run against
  // a real Postgres. Optional until Phase 4.
  DATABASE_URL: z.string().optional(),

  // ---- Demo mode ----
  // Demo mode is implicit: it turns on as soon as a pre-warmed fork is supplied.
  // A real Aiven fork takes ~5 min, longer than a 4-min demo, so we cannot fork
  // on stage. The in-sandbox agent still issues a real fork call (so the audience
  // sees it), but everything resolves to this already-live fork: the preview app
  // reads it via DATABASE_URL, and the agent's Aiven MCP calls are redirected to
  // it by the proxy. See src/lib/shell/demo.ts and the create-demo-fork skill.
  //
  // URL: the fork's Postgres connection string, injected as the preview app's
  // DATABASE_URL. NAME/PROJECT: the fork's Aiven service identity, used by the
  // proxy to redirect the agent's by-name MCP calls (pg_read/write, connection
  // info, status, metrics) onto it. Both are required together.
  IVAN_DEMO_FORK_URL: z.string().optional(),
  IVAN_DEMO_FORK_NAME: z.string().optional(),
  IVAN_DEMO_FORK_PROJECT: z.string().min(1).default('coloop'),
  // When true, the proxy answers the agent's fork-create with a synthetic
  // "RUNNING" result and never creates a real service, so rehearsals don't leave
  // paid throwaway forks to clean up. Default false (a real fork is created and
  // must be terminated via the create-demo-fork skill's cleanup).
  IVAN_DEMO_FAKE_CREATE: z.enum(['true', 'false']).default('false'),

  // ---- MCP trace mode ----
  // When true, the in-sandbox Aiven MCP server runs behind a thin logging proxy
  // that records every JSON-RPC request/response to a trace file in the sandbox,
  // exfil'd via GET /api/sessions/:id/mcp-trace. Used to capture the real call
  // shapes (fork create, status, connection string, SQL) before faking them.
  IVAN_MCP_TRACE: z.enum(['true', 'false']).default('false'),

  // Aiven API token. Gives the in-sandbox agent the Aiven MCP server (via
  // `npx mcp-aiven`) so it can provision and inspect Aiven services live.
  // Create one in the Aiven Console; needs org-level "Allow MCP connection".
  AIVEN_TOKEN: z.string().min(1),
  // Restrict the MCP to non-destructive operations. Defaults to write access
  // (false) so the agent can actually create services.
  AIVEN_READ_ONLY: z.enum(['true', 'false']).default('false'),
  // Let the MCP return real connection credentials so the agent can connect to
  // a fork and run SQL. On by default; pair with a fork-scoped token that
  // cannot reach prod. Set false to harden.
  AIVEN_ALLOW_SECRETS: z.enum(['true', 'false']).default('true'),

  SANDBOX_DEV_PORT: z.coerce.number().int().positive().default(3000),
  SANDBOX_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(30 * 60 * 1000),
})

// Demo needs both the connection URL (for the preview app) and the service
// name (for the MCP proxy redirect). Setting one without the other is a
// misconfiguration that would half-wire the demo, so fail fast.
const schemaWithChecks = schema.superRefine((value, ctx) => {
  const hasUrl = Boolean(value.IVAN_DEMO_FORK_URL)
  const hasName = Boolean(value.IVAN_DEMO_FORK_NAME)
  if (hasUrl !== hasName) {
    ctx.addIssue({
      code: 'custom',
      message:
        'Demo mode needs both IVAN_DEMO_FORK_URL and IVAN_DEMO_FORK_NAME set together.',
      path: [hasUrl ? 'IVAN_DEMO_FORK_NAME' : 'IVAN_DEMO_FORK_URL'],
    })
  }
})

export type Env = z.infer<typeof schema>

let cached: Env | null = null

export function getEnv(): Env {
  if (cached) {
    return cached
  }
  const parsed = schemaWithChecks.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ')
    throw new Error(`Invalid environment configuration: ${issues}`)
  }
  cached = parsed.data
  return cached
}

export interface RepoCoordinates {
  owner: string
  repo: string
}

// Parse `owner` and `repo` out of a GitHub URL (https or ssh, .git or not).
export function parseRepo(url: string): RepoCoordinates {
  const match = /github\.com[/:]([^/]+)\/(.+?)(?:\.git)?\/?$/.exec(url)
  if (!match) {
    throw new Error(`Cannot parse owner/repo from URL: ${url}`)
  }
  return { owner: match[1], repo: match[2] }
}
