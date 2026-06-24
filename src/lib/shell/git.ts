import type { Sandbox } from '@vercel/sandbox'
import { runInProject } from './commands'
import type { SessionLogger } from './logger'

// Commit any working-tree changes and push the session branch to origin.
// (origin already carries the auth token from clone.)
export async function pushChangesToBranch(
  sandbox: Sandbox,
  branch: string,
  commitMessage: string,
  logger: SessionLogger,
): Promise<{ success: boolean; pushed: boolean; error?: string }> {
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
