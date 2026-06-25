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

export type Env = z.infer<typeof schema>

let cached: Env | null = null

export function getEnv(): Env {
  if (cached) {
    return cached
  }
  const parsed = schema.safeParse(process.env)
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
