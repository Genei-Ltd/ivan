import { EventEmitter } from 'node:events'
import type { Sandbox } from '@vercel/sandbox'
import type { ChatMessage, LogEntry, Session, ShellEvent } from './types'
import type { UploadedImageAttachment } from './attachments'
import {
  listPersistedSessions,
  loadImageAttachment,
  loadSession as loadPersistedSession,
  saveClaudeSessionId,
  saveImageAttachments,
  saveSessionSnapshot,
} from './persistence'

// In-memory runtime store with a per-session event bus. Durable metadata is
// snapshotted to Postgres when DATABASE_URL is present; live Sandbox handles
// stay in this non-serialisable runtime map.

interface Runtime {
  session: Session
  emitter: EventEmitter
  buffer: ShellEvent[]
  attachments?: Map<string, UploadedImageAttachment>
  sandbox?: Sandbox
  claudeSessionId?: string
  // Wall-clock ms timestamp the sandbox is currently set to auto-terminate at.
  // Tracked so the keepalive only extends when the runway drops below the
  // window, rather than ballooning the total on every heartbeat.
  keepAliveDeadline?: number
}

const MAX_BUFFER = 10000
const RUNTIME_BOUND_STATUSES = new Set([
  'creating',
  'resuming',
  'ready',
  'working',
  'submitting',
])

// Survive HMR in dev by hanging the map off globalThis.
const globalForStore = globalThis as unknown as {
  __shellRuntimes?: Map<string, Runtime>
}
const runtimes: Map<string, Runtime> =
  globalForStore.__shellRuntimes ??
  (globalForStore.__shellRuntimes = new Map<string, Runtime>())

const persistChain = new Map<string, Promise<void>>()

function cloneMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    attachments: message.attachments?.map((attachment) => ({ ...attachment })),
    parts: message.parts?.map((part) => ({ ...part })),
  }
}

function cloneSession(session: Session): Session {
  return {
    ...session,
    messages: session.messages.map(cloneMessage),
    logs: session.logs.map((log) => ({ ...log })),
  }
}

function sessionHistory(session: Session): ShellEvent[] {
  const history: ShellEvent[] = [
    { kind: 'status', status: session.status },
    ...session.messages.map(
      (message): ShellEvent => ({ kind: 'message', message }),
    ),
    ...session.logs.map((entry): ShellEvent => ({ kind: 'log', entry })),
  ]

  if (session.previewUrl) {
    history.push({ kind: 'preview', url: session.previewUrl })
  }
  if (session.prUrl) {
    history.push({ kind: 'pr', url: session.prUrl })
  }
  if (session.error) {
    history.push({ kind: 'error', message: session.error })
  }

  return history
}

function queuePersist(runtime: Runtime): Promise<void> {
  const snapshot = cloneSession(runtime.session)
  const claudeSessionId = runtime.claudeSessionId
  const previous = persistChain.get(snapshot.id) ?? Promise.resolve()
  const next = previous
    .catch(() => undefined)
    .then(() => saveSessionSnapshot(snapshot, claudeSessionId))
  const queued = next.finally(() => {
    if (persistChain.get(snapshot.id) === queued) {
      persistChain.delete(snapshot.id)
    }
  })

  persistChain.set(snapshot.id, queued)
  void next.catch(() => undefined)
  return queued
}

function restoredSession(session: Session): Session {
  if (session.prUrl || session.status === 'submitted') {
    return session
  }

  if (!RUNTIME_BOUND_STATUSES.has(session.status)) {
    return session
  }

  return {
    ...session,
    status: 'stopped',
    logs: [
      ...session.logs,
      {
        type: 'info',
        message:
          'Session restored from storage; reconnecting the sandbox before continuing.',
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

export function createSessionRecord(
  session: Session,
  options: { seedHistory?: boolean; persist?: boolean } = {},
): void {
  const emitter = new EventEmitter()
  emitter.setMaxListeners(0)
  const sessionRecord = cloneSession(session)
  runtimes.set(session.id, {
    session: sessionRecord,
    emitter,
    buffer: options.seedHistory ? sessionHistory(sessionRecord) : [],
    attachments: new Map(),
  })
  if (options.persist ?? true) {
    const runtime = runtimes.get(session.id)
    if (runtime) {
      void queuePersist(runtime)
    }
  }
}

export function getSession(id: string): Session | undefined {
  return runtimes.get(id)?.session
}

export async function ensureSessionLoaded(
  id: string,
): Promise<Session | undefined> {
  const existing = getSession(id)
  if (existing) {
    return existing
  }

  const persisted = await loadPersistedSession(id)
  if (!persisted) {
    return undefined
  }

  const session = restoredSession(persisted.session)
  createSessionRecord(session, { seedHistory: true, persist: false })
  const runtime = runtimes.get(id)
  if (runtime) {
    runtime.claudeSessionId = persisted.claudeSessionId
  }
  return runtime?.session
}

export function listSessions(): Session[] {
  return [...runtimes.values()]
    .map((r) => r.session)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function listAllSessions(): Promise<Session[]> {
  const sessions = new Map<string, Session>()
  for (const session of await listPersistedSessions()) {
    sessions.set(session.id, session)
  }
  for (const session of listSessions()) {
    sessions.set(session.id, session)
  }
  return [...sessions.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
}

export async function waitForSessionPersistence(id: string): Promise<void> {
  await (persistChain.get(id) ?? Promise.resolve())
}

export function getSandbox(id: string): Sandbox | undefined {
  return runtimes.get(id)?.sandbox
}

export function setSandbox(id: string, sandbox: Sandbox | undefined): void {
  const r = runtimes.get(id)
  if (r) {
    r.sandbox = sandbox
  }
}

export function setSandboxName(id: string, sandboxName: string): void {
  const r = runtimes.get(id)
  if (r) {
    r.session.sandboxName = sandboxName
    r.session.updatedAt = new Date().toISOString()
    void queuePersist(r)
  }
}

export function getKeepAliveDeadline(id: string): number | undefined {
  return runtimes.get(id)?.keepAliveDeadline
}

export function setKeepAliveDeadline(id: string, deadline: number): void {
  const r = runtimes.get(id)
  if (r) {
    r.keepAliveDeadline = deadline
  }
}

export function getClaudeSessionId(id: string): string | undefined {
  return runtimes.get(id)?.claudeSessionId
}

export function setClaudeSessionId(id: string, claudeSessionId: string): void {
  const r = runtimes.get(id)
  if (r) {
    r.claudeSessionId = claudeSessionId
    void saveClaudeSessionId(id, claudeSessionId).catch(() => undefined)
    void queuePersist(r)
  }
}

export function storeImageAttachments(
  id: string,
  attachments: UploadedImageAttachment[],
): void {
  const r = runtimes.get(id)
  if (!r) {
    return
  }
  r.attachments ??= new Map()
  for (const attachment of attachments) {
    r.attachments.set(attachment.id, attachment)
  }

  const afterSessionSnapshot = persistChain.get(id) ?? Promise.resolve()
  void afterSessionSnapshot
    .catch(() => undefined)
    .then(() => saveImageAttachments(id, attachments))
    .catch(() => undefined)
}

export function getImageAttachment(
  id: string,
  attachmentId: string,
): UploadedImageAttachment | undefined {
  const r = runtimes.get(id)
  return r?.attachments?.get(attachmentId)
}

export async function ensureImageAttachmentLoaded(
  id: string,
  attachmentId: string,
): Promise<UploadedImageAttachment | undefined> {
  await ensureSessionLoaded(id)
  const existing = getImageAttachment(id, attachmentId)
  if (existing) {
    return existing
  }

  const attachment = await loadImageAttachment(id, attachmentId)
  const r = runtimes.get(id)
  if (attachment && r) {
    r.attachments ??= new Map()
    r.attachments.set(attachment.id, attachment)
  }
  return attachment
}

// Emit an event: persist any state it implies onto the session, buffer it for
// replay, and notify live subscribers.
export function emit(id: string, event: ShellEvent): void {
  const r = runtimes.get(id)
  if (!r) {
    return
  }

  switch (event.kind) {
    case 'status':
      r.session.status = event.status
      if (event.status !== 'error') {
        r.session.error = undefined
      }
      break
    case 'log':
      r.session.logs.push(event.entry)
      break
    case 'message': {
      const existing = r.session.messages.findIndex(
        (m) => m.id === event.message.id,
      )
      if (existing >= 0) {
        r.session.messages[existing] = event.message
      } else {
        r.session.messages.push(event.message)
      }
      break
    }
    case 'preview':
      r.session.previewUrl = event.url
      break
    case 'pr':
      r.session.prUrl = event.url
      break
    case 'error':
      r.session.error = event.message
      break
    case 'changes':
      break
  }

  r.session.updatedAt = new Date().toISOString()
  r.buffer.push(event)
  if (r.buffer.length > MAX_BUFFER) {
    r.buffer.shift()
  }
  r.emitter.emit('event', event)
  void queuePersist(r)
}

// Subscribe to a session's events. Returns buffered history plus an unsubscribe.
export function subscribe(
  id: string,
  onEvent: (event: ShellEvent) => void,
): { history: ShellEvent[]; unsubscribe: () => void } | undefined {
  const r = runtimes.get(id)
  if (!r) {
    return undefined
  }
  const handler = (event: ShellEvent) => {
    onEvent(event)
  }
  r.emitter.on('event', handler)
  return {
    history: [...r.buffer],
    unsubscribe: () => r.emitter.off('event', handler),
  }
}

// Convenience helpers used by the manager/engine.
export function setMessage(id: string, message: ChatMessage): void {
  emit(id, { kind: 'message', message })
}

export function appendLog(id: string, entry: LogEntry): void {
  emit(id, { kind: 'log', entry })
}
