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
    await logger.info('Claude CLI already installed')
    return true
  }
  await logger.info('Installing Claude CLI…')
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
    await logger.info('Claude CLI installed')
    return true
  }
  await logger.error('Failed to install Claude CLI')
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
      return { success: false, error: 'Failed to install Claude CLI', sandbox }
    }

    // Postgres client so the agent can connect to an Aiven fork and run SQL.
    await installPsql(sandbox, logger)

    // Git identity + session branch.
    await runInProject(sandbox, 'git', ['config', 'user.name', 'Lovable Shell'])
    await runInProject(sandbox, 'git', ['config', 'user.email', 'shell@local'])
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

    // Start the dev server on the exposed port.
    await startDevServer(sandbox, packageManager, logger)

    const domain = sandbox.domain(env.SANDBOX_DEV_PORT)
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

  const devArgs =
    packageManager === 'npm'
      ? ['run', 'dev', ...(isNext16 ? ['--', '--webpack'] : [])]
      : ['dev', ...(isNext16 ? ['--webpack'] : [])]
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

  // Give the server a moment to bind before the preview iframe points at it.
  await new Promise((resolve) => setTimeout(resolve, 3000))
}
