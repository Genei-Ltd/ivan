import { randomUUID } from 'node:crypto'
import { getEnv } from '@/lib/env'
import type { Session } from './types'
import {
  createSessionRecord,
  emit,
  ensureSessionLoaded,
  getClaudeSessionId,
  getKeepAliveDeadline,
  getSandbox,
  setClaudeSessionId,
  setKeepAliveDeadline,
  setMessage,
  setSandbox,
  setSandboxName,
  storeImageAttachments,
} from './store'
import { createSessionLogger } from './logger'
import { branchNameFromPrompt } from './branch'
import { createSandbox, resumeSandbox, sandboxNameForSession } from './creation'
import { executeClaudeInSandbox } from './agent'
import { pushChangesToBranch } from './git'
import { createPullRequest } from './github'
import {
  toChatImageAttachment,
  type UploadedImageAttachment,
} from './attachments'

interface CreateSessionOptions {
  slackThreadId?: string
}

const resumePromises = new Map<string, Promise<void>>()

// Kick off a new session: record it, surface the first user message, and start
// provisioning + the initial agent turn in the background. Returns immediately
// so the client can navigate to the workspace and subscribe to events.
export function createSession(
  prompt: string,
  attachments: UploadedImageAttachment[] = [],
  options: CreateSessionOptions = {},
): Session {
  const env = getEnv()
  const id = randomUUID()
  const branch = branchNameFromPrompt(prompt)
  const sandboxName = sandboxNameForSession(id)
  const firstMessage = {
    id: randomUUID(),
    role: 'user' as const,
    content: prompt,
    attachments: attachments.map((attachment) =>
      toChatImageAttachment(id, attachment),
    ),
  }
  const session: Session = {
    id,
    status: 'creating',
    repoUrl: env.TARGET_REPO_URL,
    baseBranch: env.TARGET_REPO_BRANCH,
    branch,
    sandboxName,
    slackThreadId: options.slackThreadId,
    messages: [firstMessage],
    logs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  createSessionRecord(session)
  storeImageAttachments(id, attachments)
  emit(id, { kind: 'status', status: 'creating' })
  // Buffer the first user message as an event so late SSE subscribers replay it.
  // It is already in session.messages, so emit() updates in place (no dupe).
  setMessage(id, firstMessage)

  void provisionAndRun(id, prompt, attachments)
  return session
}

async function provisionAndRun(
  id: string,
  prompt: string,
  attachments: UploadedImageAttachment[],
): Promise<void> {
  const logger = createSessionLogger(id)
  const session = await ensureSessionLoaded(id)
  if (!session) {
    return
  }

  const sandboxName = session.sandboxName ?? sandboxNameForSession(id)
  setSandboxName(id, sandboxName)

  const result = await createSandbox(session.branch, sandboxName, logger)
  if (result.sandbox) {
    setSandbox(id, result.sandbox)
    setSandboxName(id, result.sandbox.name)
    // The sandbox starts with the base timeout; track its deadline so the
    // workspace keepalive can roll it forward while the page is open.
    setKeepAliveDeadline(id, Date.now() + getEnv().SANDBOX_TIMEOUT_MS)
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

  await runAgentTurn(id, prompt, attachments)
}

export async function resumeSession(id: string): Promise<void> {
  const existing = resumePromises.get(id)
  if (existing) {
    await existing
    return
  }

  const promise = resumeSessionOnce(id)
  resumePromises.set(id, promise)
  try {
    await promise
  } finally {
    resumePromises.delete(id)
  }
}

async function resumeSessionOnce(id: string): Promise<void> {
  const logger = createSessionLogger(id)
  const session = await ensureSessionLoaded(id)
  if (!session) {
    throw new Error('Session not found')
  }

  if (session.status === 'resuming') {
    return
  }

  const sandboxName = session.sandboxName ?? getSandbox(id)?.name
  if (!sandboxName) {
    emit(id, {
      kind: 'error',
      message: 'No persistent sandbox name is available for this session.',
    })
    emit(id, { kind: 'status', status: 'error' })
    return
  }

  emit(id, { kind: 'status', status: 'resuming' })
  setSandboxName(id, sandboxName)

  const result = await resumeSandbox(sandboxName, logger)
  if (result.sandbox) {
    setSandbox(id, result.sandbox)
    setSandboxName(id, result.sandbox.name)
    setKeepAliveDeadline(id, Date.now() + getEnv().SANDBOX_TIMEOUT_MS)
  }

  if (!result.success || !result.sandbox) {
    emit(id, { kind: 'error', message: result.error ?? 'Resume failed' })
    emit(id, { kind: 'status', status: 'error' })
    return
  }

  if (result.domain) {
    emit(id, { kind: 'preview', url: result.domain })
  }
  emit(id, { kind: 'status', status: 'ready' })
}

export async function maybeAutoResumeSession(id: string): Promise<void> {
  const session = await ensureSessionLoaded(id)
  if (!session || getSandbox(id)) {
    return
  }
  if (
    session.status === 'creating' ||
    session.status === 'working' ||
    session.status === 'submitting'
  ) {
    return
  }
  if (!session.sandboxName || session.status === 'submitted' || session.prUrl) {
    return
  }
  if (session.status === 'resuming') {
    return
  }

  void resumeSession(id).catch((error: unknown) => {
    emit(id, {
      kind: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to resume session',
    })
    emit(id, { kind: 'status', status: 'error' })
  })
}

// Run one agent turn against the session's sandbox, streaming the assistant
// message as it is produced.
async function runAgentTurn(
  id: string,
  instruction: string,
  attachments: UploadedImageAttachment[] = [],
): Promise<void> {
  const env = getEnv()
  const logger = createSessionLogger(id)
  let sandbox = getSandbox(id)
  if (!sandbox) {
    await resumeSession(id)
    sandbox = getSandbox(id)
  }
  if (!sandbox) {
    emit(id, { kind: 'error', message: 'No active sandbox for session' })
    emit(id, { kind: 'status', status: 'error' })
    return
  }

  emit(id, { kind: 'status', status: 'working' })
  const assistantId = randomUUID()
  setMessage(id, { id: assistantId, role: 'assistant', content: '' })

  const result = await executeClaudeInSandbox(sandbox, instruction, {
    sessionId: id,
    model: env.AGENT_MODEL,
    apiKey: env.ANTHROPIC_API_KEY,
    baseUrl: env.ANTHROPIC_BASE_URL,
    resumeSessionId: getClaudeSessionId(id),
    imageAttachments: attachments,
    aivenToken: env.AIVEN_TOKEN,
    aivenReadOnly: env.AIVEN_READ_ONLY === 'true',
    aivenAllowSecrets: env.AIVEN_ALLOW_SECRETS === 'true',
    logger,
    onAssistantUpdate: ({ content, parts }) => {
      setMessage(id, { id: assistantId, role: 'assistant', content, parts })
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
export async function sendMessage(
  id: string,
  content: string,
  attachments: UploadedImageAttachment[] = [],
): Promise<void> {
  const session = await ensureSessionLoaded(id)
  if (!session) {
    throw new Error('Session not found')
  }
  storeImageAttachments(id, attachments)
  setMessage(id, {
    id: randomUUID(),
    role: 'user',
    content,
    attachments: attachments.map((attachment) =>
      toChatImageAttachment(id, attachment),
    ),
  })
  await runAgentTurn(id, content, attachments)
}

// Commit, push, and open a PR from the session branch.
export async function submitSession(id: string): Promise<void> {
  const logger = createSessionLogger(id)
  const session = await ensureSessionLoaded(id)
  let sandbox = getSandbox(id)
  if (!session) {
    throw new Error('Session not found')
  }
  if (!sandbox) {
    await resumeSession(id)
    sandbox = getSandbox(id)
  }
  if (!sandbox) {
    emit(id, { kind: 'error', message: 'No active sandbox for session' })
    emit(id, { kind: 'status', status: 'error' })
    return
  }

  emit(id, { kind: 'status', status: 'submitting' })

  const firstPrompt =
    session.messages.find((m) => m.role === 'user')?.content ?? 'Update'
  const title = firstPrompt.slice(0, 72)

  const push = await pushChangesToBranch(
    sandbox,
    session.branch,
    title,
    logger,
    session.previewUrl,
  )
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

// Keep the workspace's sandbox alive while the page is open. Each heartbeat
// rolls the auto-terminate deadline to at least KEEPALIVE_WINDOW_MS ahead, so
// the sandbox survives as long as heartbeats arrive and frees itself within the
// window after the tab closes. extendTimeout only adds to the total (capped at
// the plan's 24h), so we extend by just the shortfall and track the deadline.
const KEEPALIVE_WINDOW_MS = 5 * 60 * 1000
const MAX_SANDBOX_LIFETIME_MS = 24 * 60 * 60 * 1000

export async function keepSessionAlive(id: string): Promise<void> {
  const sandbox = getSandbox(id)
  if (!sandbox) {
    return
  }

  const session = await ensureSessionLoaded(id)
  const startedAt = session ? Date.parse(session.createdAt) : Date.now()
  const maxDeadline = startedAt + MAX_SANDBOX_LIFETIME_MS

  const target = Math.min(Date.now() + KEEPALIVE_WINDOW_MS, maxDeadline)
  const current = getKeepAliveDeadline(id) ?? 0
  if (target <= current) {
    return // still enough runway
  }

  try {
    await sandbox.extendTimeout(target - current)
    setKeepAliveDeadline(id, target)
  } catch {
    // Sandbox already gone or the 24h plan cap reached; nothing to do.
  }
}

// Stop the sandbox and mark the session stopped.
export async function teardownSession(id: string): Promise<void> {
  await ensureSessionLoaded(id)
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
