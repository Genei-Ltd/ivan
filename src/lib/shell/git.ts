import type { Sandbox } from '@vercel/sandbox'
import { PROJECT_DIR, runCommandInSandbox, runInProject } from './commands'
import type { SessionLogger } from './logger'

function hostnameFromUrl(url: string): string | undefined {
  try {
    return new URL(url).hostname
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
  }
}

async function clearRuntimeNextDevOrigin(
  sandbox: Sandbox,
  previewUrl: string | undefined,
  logger: SessionLogger,
): Promise<boolean> {
  const host = previewUrl ? hostnameFromUrl(previewUrl) : undefined
  if (!host) {
    return true
  }

  // `creation.ts` patches the target config so Next dev accepts the sandbox
  // iframe host. Before committing, remove only that host and clear the git
  // assume-unchanged bit so genuine agent edits to next.config.* are visible.
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
const quotedHost = JSON.stringify(host)
let next = source
for (const token of [
  quotedHost + ', ',
  quotedHost + ',',
  ', ' + quotedHost,
  ',' + quotedHost,
  quotedHost,
]) {
  next = next.split(token).join('')
}
next = next.replace(
  /^[ \\t]*allowedDevOrigins:\\s*\\[\\s*\\],\\s*\\/\\/ Ivan runtime dev origin\\n/m,
  '',
)
if (next !== source) {
  fs.writeFileSync(file, next)
}
try {
  execFileSync('git', ['update-index', '--no-assume-unchanged', file], {
    stdio: 'ignore',
  })
} catch {}
if (next !== source) {
  process.stdout.write('removed')
}
`

  const result = await runCommandInSandbox(sandbox, 'sh', [
    '-c',
    `cd ${PROJECT_DIR} && node <<'NODE'\n${script}\nNODE`,
  ])

  if (result.output?.trim() === 'removed') {
    await logger.info('Removed runtime Next dev origin allowlist')
  }
  if (!result.success && result.exitCode !== 2) {
    await logger.error(
      'Could not clean runtime Next dev origin allowlist before commit',
    )
    return false
  }
  return true
}

// Commit any working-tree changes and push the session branch to origin.
// (origin already carries the auth token from clone.)
export async function pushChangesToBranch(
  sandbox: Sandbox,
  branch: string,
  commitMessage: string,
  logger: SessionLogger,
  previewUrl?: string,
): Promise<{ success: boolean; pushed: boolean; error?: string }> {
  const clean = await clearRuntimeNextDevOrigin(sandbox, previewUrl, logger)
  if (!clean) {
    return {
      success: false,
      pushed: false,
      error: 'Failed to clean runtime Next dev origin allowlist',
    }
  }

  const status = await runInProject(sandbox, 'git', ['status', '--porcelain'])
  if (!status.output?.trim()) {
    await logger.info('No changes to commit')
    return { success: true, pushed: false }
  }

  await logger.info('Committing changes…')
  const add = await runInProject(sandbox, 'git', ['add', '.'])
  if (!add.success) {
    return { success: false, pushed: false, error: 'git add failed' }
  }

  const commit = await runInProject(sandbox, 'git', [
    'commit',
    '-m',
    commitMessage,
  ])
  if (!commit.success) {
    return { success: false, pushed: false, error: 'git commit failed' }
  }

  const push = await runInProject(sandbox, 'git', [
    'push',
    '-u',
    'origin',
    branch,
  ])
  if (!push.success) {
    await logger.error('Failed to push branch')
    return {
      success: false,
      pushed: false,
      error: push.error ?? 'git push failed',
    }
  }
  await logger.success('Pushed branch to origin')
  return { success: true, pushed: true }
}
