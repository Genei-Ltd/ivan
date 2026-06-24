import { Writable } from 'node:stream'
import type { Sandbox } from '@vercel/sandbox'
import { runCommandInSandbox, runInProject, PROJECT_DIR } from './commands'
import type { SessionLogger } from './logger'
import type { AgentExecutionResult } from './types'

export interface RunClaudeOptions {
  model: string
  apiKey: string
  baseUrl?: string
  // Pass the previous Claude chat session id to continue the conversation in a
  // kept-alive sandbox (multi-turn chat).
  resumeSessionId?: string
  logger: SessionLogger
  // Called with the full accumulated assistant content on every update, so the
  // caller can upsert the streaming chat message.
  onAssistantContent: (content: string) => void
}

// Turn a tool_use block into a short human-readable status line.
function describeToolUse(
  toolName: string,
  input: Record<string, unknown>,
): string {
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  switch (toolName) {
    case 'Write':
    case 'Edit':
      return `Editing ${str(input.path) || str(input.file_path) || 'file'}`
    case 'Read':
      return `Reading ${str(input.path) || str(input.file_path) || 'file'}`
    case 'Glob':
      return `Searching files: ${str(input.pattern) || '*'}`
    case 'Grep':
      return `Grep: ${str(input.pattern) || 'pattern'}`
    case 'Bash': {
      const command = str(input.command) || 'command'
      return `Running: ${command.length > 60 ? command.slice(0, 60) + '…' : command}`
    }
    default:
      return ''
  }
}

// Run the Claude Code engine headlessly inside the sandbox, streaming its
// stream-json output back through onAssistantContent. Secrets and the prompt
// are passed via env (not interpolated into the shell), and completion is
// awaited via the detached command rather than polling.
export async function executeClaudeInSandbox(
  sandbox: Sandbox,
  instruction: string,
  opts: RunClaudeOptions,
): Promise<AgentExecutionResult> {
  const {
    model,
    apiKey,
    baseUrl,
    resumeSessionId,
    logger,
    onAssistantContent,
  } = opts

  const cliCheck = await runCommandInSandbox(sandbox, 'which', ['claude'])
  if (!cliCheck.success) {
    return {
      success: false,
      changesDetected: false,
      error: 'Claude CLI not found in sandbox',
    }
  }

  const flags = [
    `--model ${model}`,
    '--print',
    '--dangerously-skip-permissions',
    '--output-format stream-json',
    '--verbose',
  ]
  if (resumeSessionId) {
    flags.push(`--resume "${resumeSessionId}"`)
  }

  // Prompt arrives via $AGENT_PROMPT so quotes/newlines can't break the shell.
  const command = `claude ${flags.join(' ')} -- "$AGENT_PROMPT"`

  const env: Record<string, string> = {
    ANTHROPIC_API_KEY: apiKey,
    AGENT_PROMPT: instruction,
  }
  if (baseUrl) {
    env.ANTHROPIC_BASE_URL = baseUrl
  }

  await logger.command(`claude ${flags.join(' ')} -- "<prompt>"`)

  let accumulated = ''
  let extractedSessionId: string | undefined
  let pending = ''

  const handleLine = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed) {
      return
    }
    interface ContentBlock {
      type?: string
      text?: string
      name?: string
      input?: Record<string, unknown>
    }
    interface StreamLine {
      type?: string
      session_id?: string
      message?: { content?: ContentBlock[] }
    }
    let parsed: StreamLine
    try {
      parsed = JSON.parse(trimmed) as StreamLine
    } catch {
      return
    }

    if (parsed.session_id) {
      extractedSessionId = parsed.session_id
    }

    if (parsed.type === 'assistant' && parsed.message?.content) {
      for (const block of parsed.message.content) {
        if (block.type === 'text' && typeof block.text === 'string') {
          accumulated += block.text
          onAssistantContent(accumulated)
        } else if (
          block.type === 'tool_use' &&
          typeof block.name === 'string'
        ) {
          const status = describeToolUse(block.name, block.input ?? {})
          if (status) {
            accumulated += `\n\n_${status}_\n\n`
            onAssistantContent(accumulated)
            void logger.info(status)
          }
        }
      }
    }
  }

  const captureStdout = new Writable({
    write(
      chunk: Buffer,
      _enc: BufferEncoding,
      callback: (error?: Error | null) => void,
    ) {
      pending += chunk.toString()
      const lines = pending.split('\n')
      pending = lines.pop() ?? ''
      for (const line of lines) {
        handleLine(line)
      }
      callback()
    },
  })

  const captureStderr = new Writable({
    write(_chunk, _enc, callback) {
      callback()
    },
  })

  try {
    const running = await sandbox.runCommand({
      cmd: 'sh',
      args: ['-c', `cd ${PROJECT_DIR} && ${command}`],
      env,
      detached: true,
      stdout: captureStdout,
      stderr: captureStderr,
    })

    const finished = await running.wait()
    if (pending) {
      handleLine(pending)
    } // flush any trailing partial line

    if (finished.exitCode !== 0) {
      await logger.error(`Claude exited with code ${String(finished.exitCode)}`)
    }

    const status = await runInProject(sandbox, 'git', ['status', '--porcelain'])
    const changesDetected = Boolean(status.success && status.output?.trim())

    return {
      success: finished.exitCode === 0,
      changesDetected,
      sessionId: extractedSessionId,
      error:
        finished.exitCode === 0
          ? undefined
          : `Agent exited with code ${String(finished.exitCode)}`,
    }
  } catch (error: unknown) {
    return {
      success: false,
      changesDetected: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to execute Claude in sandbox',
    }
  }
}
