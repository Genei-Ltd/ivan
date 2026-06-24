import { randomUUID } from 'node:crypto'
import { getEnv } from '@/lib/env'
import type { Session } from './types'
import {
  createSessionRecord,
  emit,
  getClaudeSessionId,
  getSandbox,
  getSession,
  setClaudeSessionId,
  setMessage,
  setSandbox,
} from './store'
import { createSessionLogger } from './logger'
import { branchNameFromPrompt } from './branch'
import { createSandbox } from './creation'
import { executeClaudeInSandbox } from './agent'
import { pushChangesToBranch } from './git'
import { createPullRequest } from './github'

// Kick off a new session: record it, surface the first user message, and start
// provisioning + the initial agent turn in the background. Returns immediately
// so the client can navigate to the workspace and subscribe to events.
export function createSession(prompt: string): Session {
  const env = getEnv()
  const id = randomUUID()
  const branch = branchNameFromPrompt(prompt)
  const session: Session = {
    id,
    status: 'creating',
    repoUrl: env.TARGET_REPO_URL,
    baseBranch: env.TARGET_REPO_BRANCH,
    branch,
    messages: [{ id: randomUUID(), role: 'user', content: prompt }],
    logs: [],
    createdAt: new Date().toISOString(),
  }
  createSessionRecord(session)
  emit(id, { kind: 'status', status: 'creating' })

  void provisionAndRun(id, prompt)
  return session
}

async function provisionAndRun(id: string, prompt: string): Promise<void> {
  const logger = createSessionLogger(id)
  const session = getSession(id)
  if (!session) {
    return
  }

  const result = await createSandbox(session.branch, logger)
  if (result.sandbox) {
    setSandbox(id, result.sandbox)
  }

  if (!result.success || !result.sandbox) {
    emit(id, { kind: 'error', message: result.error ?? 'Provisioning failed' })
    emit(id, { kind: 'status', status: 'error' })
    return
  }

  if (result.domain) {
    emit(id, { kind: 'preview', url: result.domain })
  }
  emit(id, { kind: 'status', status: 'ready' })

  await runAgentTurn(id, prompt)
}

// Run one agent turn against the session's sandbox, streaming the assistant
// message as it is produced.
async function runAgentTurn(id: string, instruction: string): Promise<void> {
  const env = getEnv()
  const logger = createSessionLogger(id)
  const sandbox = getSandbox(id)
  if (!sandbox) {
    emit(id, { kind: 'error', message: 'No active sandbox for session' })
    emit(id, { kind: 'status', status: 'error' })
    return
  }

  emit(id, { kind: 'status', status: 'working' })
  const assistantId = randomUUID()
  setMessage(id, { id: assistantId, role: 'assistant', content: '' })

  const result = await executeClaudeInSandbox(sandbox, instruction, {
    model: env.AGENT_MODEL,
    apiKey: env.ANTHROPIC_API_KEY,
    baseUrl: env.ANTHROPIC_BASE_URL,
    resumeSessionId: getClaudeSessionId(id),
    logger,
    onAssistantContent: (content) => {
      setMessage(id, { id: assistantId, role: 'assistant', content })
    },
  })

  if (result.sessionId) {
    setClaudeSessionId(id, result.sessionId)
  }

  if (!result.success) {
    setMessage(id, {
      id: assistantId,
      role: 'assistant',
      content: result.error ?? 'The agent run failed.',
    })
    emit(id, { kind: 'error', message: result.error ?? 'Agent run failed' })
    emit(id, { kind: 'status', status: 'error' })
    return
  }

  emit(id, { kind: 'changes', changed: result.changesDetected })
  emit(id, { kind: 'status', status: 'ready' })
}

// Handle a follow-up chat message: record it and run another agent turn.
export async function sendMessage(id: string, content: string): Promise<void> {
  const session = getSession(id)
  if (!session) {
    throw new Error('Session not found')
  }
  setMessage(id, { id: randomUUID(), role: 'user', content })
  await runAgentTurn(id, content)
}

// Commit, push, and open a PR from the session branch.
export async function submitSession(id: string): Promise<void> {
  const logger = createSessionLogger(id)
  const session = getSession(id)
  const sandbox = getSandbox(id)
  if (!session || !sandbox) {
    throw new Error('Session not found')
  }

  emit(id, { kind: 'status', status: 'submitting' })

  const firstPrompt =
    session.messages.find((m) => m.role === 'user')?.content ?? 'Update'
  const title = firstPrompt.slice(0, 72)

  const push = await pushChangesToBranch(sandbox, session.branch, title, logger)
  if (!push.success) {
    emit(id, { kind: 'error', message: push.error ?? 'Push failed' })
    emit(id, { kind: 'status', status: 'error' })
    return
  }
  if (!push.pushed) {
    await logger.info('Nothing to submit')
    emit(id, { kind: 'status', status: 'ready' })
    return
  }

  try {
    const body = [
      firstPrompt,
      '',
      '---',
      'Opened from Ivan.',
      session.previewUrl ? `Preview: ${session.previewUrl}` : '',
    ]
      .filter(Boolean)
      .join('\n')
    const pr = await createPullRequest(session.branch, title, body)
    emit(id, { kind: 'pr', url: pr.url })
    await logger.success(`Opened PR #${String(pr.number)}`)
    emit(id, { kind: 'status', status: 'submitted' })
  } catch (error: unknown) {
    emit(id, {
      kind: 'error',
      message: error instanceof Error ? error.message : 'Failed to open PR',
    })
    emit(id, { kind: 'status', status: 'error' })
  }
}

// Stop the sandbox and mark the session stopped.
export async function teardownSession(id: string): Promise<void> {
  const sandbox = getSandbox(id)
  if (sandbox) {
    try {
      await sandbox.stop()
    } catch {
      // best effort
    }
    setSandbox(id, undefined)
  }
  emit(id, { kind: 'status', status: 'stopped' })
}
