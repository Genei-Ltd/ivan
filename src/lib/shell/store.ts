import { EventEmitter } from 'node:events'
import type { Sandbox } from '@vercel/sandbox'
import type { ChatMessage, LogEntry, Session, ShellEvent } from './types'

// In-memory session store with a per-session event bus. Replaces the
// template's Postgres persistence. Suitable for an internal, single-process
// deployment (next dev / next start), not horizontally scaled serverless.
//
// A ring buffer of events per session lets a late SSE subscriber replay history
// on connect. Live Sandbox handles and the Claude chat session id are kept in a
// separate non-serialisable runtime map.

interface Runtime {
  session: Session
  emitter: EventEmitter
  buffer: ShellEvent[]
  sandbox?: Sandbox
  claudeSessionId?: string
  // Wall-clock ms timestamp the sandbox is currently set to auto-terminate at.
  // Tracked so the keepalive only extends when the runway drops below the
  // window, rather than ballooning the total on every heartbeat.
  keepAliveDeadline?: number
}

const MAX_BUFFER = 10000

// Survive HMR in dev by hanging the map off globalThis.
const globalForStore = globalThis as unknown as {
  __shellRuntimes?: Map<string, Runtime>
}
const runtimes: Map<string, Runtime> =
  globalForStore.__shellRuntimes ??
  (globalForStore.__shellRuntimes = new Map<string, Runtime>())

export function createSessionRecord(session: Session): void {
  const emitter = new EventEmitter()
  emitter.setMaxListeners(0)
  runtimes.set(session.id, { session, emitter, buffer: [] })
}

export function getSession(id: string): Session | undefined {
  return runtimes.get(id)?.session
}

export function listSessions(): Session[] {
  return [...runtimes.values()]
    .map((r) => r.session)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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
  }
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

  r.buffer.push(event)
  if (r.buffer.length > MAX_BUFFER) {
    r.buffer.shift()
  }
  r.emitter.emit('event', event)
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
