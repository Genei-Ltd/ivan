import type { Sandbox } from '@vercel/sandbox'

// Where the target repo is cloned inside the sandbox. We clone manually (rather
// than via Sandbox.create's git source) so we control the path and can run
// every command relative to it.
export const PROJECT_DIR = '/vercel/sandbox/project'

export interface CommandResult {
  success: boolean
  exitCode?: number
  output?: string
  error?: string
  command?: string
}

export async function runCommandInSandbox(
  sandbox: Sandbox,
  command: string,
  args: string[] = [],
): Promise<CommandResult> {
  const fullCommand = args.length > 0 ? `${command} ${args.join(' ')}` : command
  try {
    const result = await sandbox.runCommand(command, args)

    let stdout = ''
    let stderr = ''
    try {
      stdout = await result.stdout()
    } catch {
      // ignore unreadable stdout
    }
    try {
      stderr = await result.stderr()
    } catch {
      // ignore unreadable stderr
    }

    return {
      success: result.exitCode === 0,
      exitCode: result.exitCode,
      output: stdout,
      error: stderr,
      command: fullCommand,
    }
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Command execution failed',
      command: fullCommand,
    }
  }
}

// Run a command with the working directory set to the cloned project. Arguments
// are single-quote escaped for the `sh -c` hop.
export async function runInProject(
  sandbox: Sandbox,
  command: string,
  args: string[] = [],
): Promise<CommandResult> {
  const escapeArg = (arg: string) => `'${arg.replace(/'/g, "'\\''")}'`
  const fullCommand =
    args.length > 0 ? `${command} ${args.map(escapeArg).join(' ')}` : command
  const cdCommand = `cd ${PROJECT_DIR} && ${fullCommand}`
  return runCommandInSandbox(sandbox, 'sh', ['-c', cdCommand])
}
