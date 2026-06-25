import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Sandbox } from '@vercel/sandbox'
import type { SessionLogger } from './logger'

const IVAN_CLAUDE_SKILLS = ['db-change'] as const

async function sandboxCommand(
  sandbox: Sandbox,
  command: string,
  env: Record<string, string>,
): Promise<{ success: boolean; stderr?: string }> {
  const result = await sandbox.runCommand({
    cmd: 'sh',
    args: ['-c', command],
    env,
  })

  let stderr = ''
  try {
    stderr = await result.stderr()
  } catch {
    // ignore unreadable stderr
  }

  return { success: result.exitCode === 0, stderr }
}

export async function installClaudeSkills(
  sandbox: Sandbox,
  logger: SessionLogger,
): Promise<boolean> {
  await logger.info('Installing Ivan skills…')

  for (const skillName of IVAN_CLAUDE_SKILLS) {
    const sourcePath = path.join(
      process.cwd(),
      'src',
      'lib',
      'shell',
      'claude-skills',
      skillName,
      'SKILL.md',
    )
    const content = await readFile(sourcePath, 'utf8')
    const encoded = Buffer.from(content, 'utf8').toString('base64')
    const command = [
      'set -eu',
      `skill_dir="$HOME/.claude/skills/${skillName}"`,
      'mkdir -p "$skill_dir"',
      'printf %s "$IVAN_SKILL_CONTENT" | base64 -d > "$skill_dir/SKILL.md"',
    ].join('\n')

    const result = await sandboxCommand(sandbox, command, {
      IVAN_SKILL_CONTENT: encoded,
    })
    if (!result.success) {
      await logger.error(
        result.stderr?.trim()
          ? `Failed to install Ivan skill ${skillName}: ${result.stderr.trim()}`
          : `Failed to install Ivan skill ${skillName}`,
      )
      return false
    }
  }

  await logger.success('Ivan skills installed')
  return true
}
