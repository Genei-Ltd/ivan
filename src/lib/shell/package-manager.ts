import type { Sandbox } from '@vercel/sandbox'
import { runInProject } from './commands'
import type { SessionLogger } from './logger'

export type PackageManager = 'pnpm' | 'yarn' | 'npm'

// Detect the package manager from lock files.
export async function detectPackageManager(
  sandbox: Sandbox,
  logger: SessionLogger,
): Promise<PackageManager> {
  if ((await runInProject(sandbox, 'test', ['-f', 'pnpm-lock.yaml'])).success) {
    await logger.info('Detected pnpm package manager')
    return 'pnpm'
  }
  if ((await runInProject(sandbox, 'test', ['-f', 'yarn.lock'])).success) {
    await logger.info('Detected yarn package manager')
    return 'yarn'
  }
  if (
    (await runInProject(sandbox, 'test', ['-f', 'package-lock.json'])).success
  ) {
    await logger.info('Detected npm package manager')
    return 'npm'
  }
  await logger.info('No lock file found, defaulting to npm')
  return 'npm'
}

export async function installDependencies(
  sandbox: Sandbox,
  packageManager: PackageManager,
  logger: SessionLogger,
): Promise<{ success: boolean; error?: string }> {
  let installCommand: string[]
  switch (packageManager) {
    case 'pnpm': {
      // Keep the store off the project tree.
      await runInProject(sandbox, 'pnpm', [
        'config',
        'set',
        'store-dir',
        '/tmp/pnpm-store',
      ])
      installCommand = ['pnpm', 'install', '--frozen-lockfile']
      break
    }
    case 'yarn':
      installCommand = ['yarn', 'install', '--frozen-lockfile']
      break
    case 'npm':
      installCommand = ['npm', 'install', '--no-audit', '--no-fund']
      break
  }

  await logger.info(`Installing dependencies with ${packageManager}`)
  const result = await runInProject(
    sandbox,
    installCommand[0],
    installCommand.slice(1),
  )
  if (result.success) {
    await logger.info('Dependencies installed')
    return { success: true }
  }
  await logger.error('Dependency install failed')
  return { success: false, error: result.error }
}
