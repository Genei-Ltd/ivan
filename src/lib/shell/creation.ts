import { Sandbox } from '@vercel/sandbox'
import { Writable } from 'node:stream'
import { runCommandInSandbox, runInProject, PROJECT_DIR } from './commands'
import {
  detectPackageManager,
  installDependencies,
  type PackageManager,
} from './package-manager'
import type { SessionLogger } from './logger'
import type { SandboxResult } from './types'
import { getAuthenticatedGitHubIdentity } from './github'
import { getEnv } from '@/lib/env'

// Embed the GitHub token so the cloned repo can be pushed back to later.
function authenticatedRepoUrl(repoUrl: string, token: string): string {
  try {
    const url = new URL(repoUrl)
    if (url.hostname === 'github.com') {
      url.username = 'x-access-token'
      url.password = token
    }
    return url.toString()
  } catch {
    return repoUrl
  }
}

async function installClaudeCLI(
  sandbox: Sandbox,
  logger: SessionLogger,
): Promise<boolean> {
  const existing = await runCommandInSandbox(sandbox, 'which', ['claude'])
  if (existing.success && existing.output?.includes('claude')) {
    await logger.info('Ivan Harness already installed')
    return true
  }
  await logger.info('Installing Ivan Harness…')
  const install = await runCommandInSandbox(sandbox, 'sh', [
    '-c',
    'curl -fsSL https://claude.ai/install.sh | bash',
  ])
  // The installer drops the binary in ~/.local/bin; make sure it is on PATH for
  // subsequent non-login shells.
  await runCommandInSandbox(sandbox, 'sh', [
    '-c',
    'ln -sf $HOME/.local/bin/claude /usr/local/bin/claude 2>/dev/null || true',
  ])
  if (install.success) {
    await logger.info('Ivan Harness installed')
    return true
  }
  await logger.error('Failed to install Ivan Harness')
  return false
}

// Make the Postgres client available so the agent can connect to an Aiven fork
// (via the MCP's credentials) and run SQL. The Vercel Sandbox base image ships
// Node and git but not psql. Best-effort and non-fatal: provisioning continues
// even if it fails, and the agent can fall back to a Node pg client.
async function installPsql(
  sandbox: Sandbox,
  logger: SessionLogger,
): Promise<void> {
  const existing = await runCommandInSandbox(sandbox, 'which', ['psql'])
  if (existing.success && existing.output?.includes('psql')) {
    await logger.info('psql already installed')
    return
  }
  await logger.info('Installing psql…')
  // The base image is Amazon Linux 2023 (dnf), but cover apt/apk in case the
  // runtime image changes. Each runs as-is then retried under non-interactive
  // sudo, in case commands are not already root.
  const attempts = [
    'dnf install -y postgresql16 || dnf install -y postgresql15',
    'microdnf install -y postgresql16 || microdnf install -y postgresql15',
    'apt-get update && apt-get install -y postgresql-client',
    'apk add --no-cache postgresql-client',
  ]
  for (const cmd of attempts) {
    await runCommandInSandbox(sandbox, 'sh', [
      '-c',
      `(${cmd}) || (sudo -n sh -c '${cmd}')`,
    ])
    const check = await runCommandInSandbox(sandbox, 'which', ['psql'])
    if (check.success && check.output?.includes('psql')) {
      await logger.success('psql installed')
      return
    }
  }
  await logger.error('Could not install psql; SQL access may be unavailable')
}

// Provision a sandbox: clone the locked repo, install deps + the agent, create
// the session branch, and start the dev server on an exposed port. Returns the
// public preview domain and the branch name. Node-only path.
export async function createSandbox(
  branch: string,
  logger: SessionLogger,
): Promise<SandboxResult & { sandbox?: Sandbox }> {
  const env = getEnv()
  try {
    await logger.info('Creating sandbox…')
    const sandbox = await Sandbox.create({
      teamId: env.SANDBOX_VERCEL_TEAM_ID,
      projectId: env.SANDBOX_VERCEL_PROJECT_ID,
      token: env.SANDBOX_VERCEL_TOKEN,
      timeout: env.SANDBOX_TIMEOUT_MS,
      ports: [env.SANDBOX_DEV_PORT],
      runtime: 'node22',
      resources: { vcpus: 4 },
    })
    await logger.info('Sandbox created')

    // Clone the repo into PROJECT_DIR with the token embedded for later push.
    await runCommandInSandbox(sandbox, 'mkdir', ['-p', PROJECT_DIR])
    const cloneUrl = authenticatedRepoUrl(env.TARGET_REPO_URL, env.GITHUB_TOKEN)
    await logger.info('Cloning repository…')
    const clone = await runCommandInSandbox(sandbox, 'git', [
      'clone',
      '--depth',
      '1',
      '--branch',
      env.TARGET_REPO_BRANCH,
      cloneUrl,
      PROJECT_DIR,
    ])
    if (!clone.success) {
      return { success: false, error: 'Failed to clone repository', sandbox }
    }
    await logger.info('Repository cloned')

    // Install dependencies.
    let packageManager: PackageManager = 'npm'
    if ((await runInProject(sandbox, 'test', ['-f', 'package.json'])).success) {
      packageManager = await detectPackageManager(sandbox, logger)
      if (packageManager === 'pnpm') {
        const hasPnpm = await runInProject(sandbox, 'which', ['pnpm'])
        if (!hasPnpm.success) {
          await logger.info('Installing pnpm…')
          await runInProject(sandbox, 'npm', ['install', '-g', 'pnpm'])
        }
      }
      const install = await installDependencies(sandbox, packageManager, logger)
      if (!install.success && packageManager !== 'npm') {
        await logger.info('Falling back to npm install')
        await installDependencies(sandbox, 'npm', logger)
      }
    }

    // Install the coding agent.
    const claudeReady = await installClaudeCLI(sandbox, logger)
    if (!claudeReady) {
      return {
        success: false,
        error: 'Failed to install Ivan Harness',
        sandbox,
      }
    }

    // Postgres client so the agent can connect to an Aiven fork and run SQL.
    await installPsql(sandbox, logger)

    // Git identity + session branch.
    const gitIdentity = await getAuthenticatedGitHubIdentity()
    await runInProject(sandbox, 'git', [
      'config',
      'user.name',
      gitIdentity.name,
    ])
    await runInProject(sandbox, 'git', [
      'config',
      'user.email',
      gitIdentity.email,
    ])
    await logger.info(`Configured git author from @${gitIdentity.login}`)
    const createBranch = await runInProject(sandbox, 'git', [
      'checkout',
      '-b',
      branch,
    ])
    if (!createBranch.success) {
      return {
        success: false,
        error: 'Failed to create session branch',
        sandbox,
      }
    }
    await logger.info(`Created branch ${branch}`)

    // The preview URL is needed before `next dev` starts so the target app can
    // accept the public sandbox host and hide dev-only browser chrome.
    const domain = sandbox.domain(env.SANDBOX_DEV_PORT)
    await startDevServer(sandbox, packageManager, domain, logger)

    await logger.success('Preview is live')
    return { success: true, sandbox, domain, branchName: branch }
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create sandbox',
    }
  }
}

async function startDevServer(
  sandbox: Sandbox,
  packageManager: PackageManager,
  previewUrl: string,
  logger: SessionLogger,
): Promise<void> {
  const env = getEnv()

  // Next.js 16 defaults to Turbopack, which can be unreliable behind the
  // sandbox proxy; force the webpack dev server.
  let isNext16 = false
  const pkg = await runInProject(sandbox, 'cat', ['package.json'])
  if (pkg.success && pkg.output) {
    try {
      const parsed = JSON.parse(pkg.output.trim()) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }
      const nextVersion =
        parsed.dependencies?.next ?? parsed.devDependencies?.next ?? ''
      isNext16 = /^[\^~]?16\./.test(nextVersion)
    } catch {
      // ignore unparseable package.json
    }
  }

  if (isNext16) {
    // Next 16 blocks HMR/dev asset requests when the app is viewed from the
    // sandbox's public iframe host. Patch the cloned target app's config before
    // booting its dev server; Ivan's own config cannot affect that process.
    await configureNextSandboxPreview(sandbox, previewUrl, logger)
  }

  // Bind explicitly to 0.0.0.0 and the exposed port so the sandbox proxy can
  // reach it (a process on 127.0.0.1 only, or that drifted to 3001, would 502
  // with SANDBOX_NOT_LISTENING).
  const port = String(env.SANDBOX_DEV_PORT)
  const nextArgs = [
    '-p',
    port,
    '-H',
    '0.0.0.0',
    ...(isNext16 ? ['--webpack'] : []),
  ]
  const devArgs =
    packageManager === 'npm'
      ? ['run', 'dev', '--', ...nextArgs]
      : ['dev', ...nextArgs]
  const devCommand = `${packageManager} ${devArgs.join(' ')}`

  await logger.info(`Starting dev server: ${devCommand}`)

  const captureDev = new Writable({
    write(
      chunk: Buffer,
      _enc: BufferEncoding,
      callback: (error?: Error | null) => void,
    ) {
      for (const line of chunk.toString().split('\n')) {
        if (line.trim()) {
          void logger.info(`[dev] ${line.trim()}`)
        }
      }
      callback()
    },
  })

  const devEnv: Record<string, string> = {}
  if (env.DATABASE_URL) {
    devEnv.DATABASE_URL = env.DATABASE_URL
  }

  await sandbox.runCommand({
    cmd: 'sh',
    args: ['-c', `cd ${PROJECT_DIR} && ${devCommand}`],
    env: devEnv,
    detached: true,
    stdout: captureDev,
    stderr: captureDev,
  })

  // Wait for the port to actually answer before the preview iframe points at
  // it. A cold `next dev` compile takes far longer than a fixed sleep, and the
  // 502 error page does not retry itself, so we must not surface the URL early.
  const ready = await waitForPort(sandbox, env.SANDBOX_DEV_PORT, logger)
  if (!ready) {
    await logger.error(
      'Dev server did not start listening in time; the preview may 502 until it finishes compiling',
    )
  }
}

function hostnameFromUrl(url: string): string | undefined {
  try {
    return new URL(url).hostname
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
  }
}

async function configureNextSandboxPreview(
  sandbox: Sandbox,
  previewUrl: string,
  logger: SessionLogger,
): Promise<void> {
  const host = hostnameFromUrl(previewUrl)
  if (!host) {
    return
  }

  // This support patch is intentionally best-effort. If the target config has a
  // shape we cannot edit safely, the preview still loads, but HMR may log the
  // cross-origin warning or show Next's dev indicator until the app config is
  // adjusted manually.
  const script = `
const fs = require('node:fs')
const { execFileSync } = require('node:child_process')
const host = ${JSON.stringify(host)}
const candidates = [
  'next.config.ts',
  'next.config.mts',
  'next.config.js',
  'next.config.mjs',
  'next.config.cjs',
]
const file = candidates.find((candidate) => fs.existsSync(candidate))
if (!file) {
  process.exit(2)
}
const source = fs.readFileSync(file, 'utf8')
let next = source

function insertConfigProperty(value, property) {
  if (/const\\s+nextConfig[^=]*=\\s*\\{/.test(value)) {
    return value.replace(
      /(const\\s+nextConfig[^=]*=\\s*)\\{/,
      '$1{\\n  ' + property,
    )
  }
  if (/module\\.exports\\s*=\\s*\\{/.test(value)) {
    return value.replace(
      /(module\\.exports\\s*=\\s*)\\{/,
      '$1{\\n  ' + property,
    )
  }
  if (/export\\s+default\\s+\\{/.test(value)) {
    return value.replace(
      /(export\\s+default\\s*)\\{/,
      '$1{\\n  ' + property,
    )
  }
}

function withAllowedDevOrigin(value) {
  if (value.includes(host)) {
    return value
  }
  if (/allowedDevOrigins\\s*:\\s*\\[/.test(value)) {
    return value.replace(
      /allowedDevOrigins\\s*:\\s*\\[/,
      (match) => match + JSON.stringify(host) + ', ',
    )
  }
  return insertConfigProperty(
    value,
    'allowedDevOrigins: [' +
      JSON.stringify(host) +
      '], // Ivan runtime dev origin',
  )
}

function withDisabledDevIndicators(value) {
  if (/devIndicators\\s*:/.test(value)) {
    return value
  }
  return insertConfigProperty(
    value,
    'devIndicators: false, // Ivan runtime dev indicators',
  )
}

const withOrigin = withAllowedDevOrigin(next)
if (!withOrigin) {
  process.exit(3)
}
next = withOrigin

const withIndicators = withDisabledDevIndicators(next)
if (!withIndicators) {
  process.exit(3)
}
next = withIndicators

if (next === source) {
  process.exit(0)
}
fs.writeFileSync(file, next)
try {
  // Hide runtime-only preview config edits until submit-time cleanup removes them.
  execFileSync('git', ['update-index', '--assume-unchanged', file], {
    stdio: 'ignore',
  })
} catch {}
`

  const result = await runCommandInSandbox(sandbox, 'sh', [
    '-c',
    `cd ${PROJECT_DIR} && node <<'NODE'\n${script}\nNODE`,
  ])

  if (result.success) {
    await logger.info(`Configured Next sandbox preview for ${host}`)
    return
  }

  if (result.exitCode === 2) {
    await logger.info('No Next config found; skipping sandbox preview config')
    return
  }

  await logger.error(
    'Could not update Next sandbox preview config; preview may show dev chrome or warn about cross-origin requests',
  )
}

// Poll the dev port from inside the sandbox until it answers HTTP or the
// deadline passes. `curl` (no -f) exits 0 once the port accepts a connection,
// even mid-compile, which is exactly the "is it listening" signal we want.
async function waitForPort(
  sandbox: Sandbox,
  port: number,
  logger: SessionLogger,
): Promise<boolean> {
  const deadlineSeconds = 120
  await logger.info('Waiting for the dev server to start listening…')
  const result = await runCommandInSandbox(sandbox, 'sh', [
    '-c',
    `for i in $(seq 1 ${String(deadlineSeconds)}); do curl -s -o /dev/null http://localhost:${String(port)} && exit 0; sleep 1; done; exit 1`,
  ])
  if (result.success) {
    await logger.success('Dev server is listening')
  }
  return result.success
}
