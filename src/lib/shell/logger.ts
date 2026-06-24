import { appendLog } from './store'
import { createLogEntry } from './logging'

// Logger used throughout the engine. Its thenable methods
// (info/command/error/success) stream log entries to the in-memory store and
// the SSE bus. The work is synchronous; methods return a resolved promise so
// `await logger.info(...)` call sites read naturally.
export class SessionLogger {
  constructor(private readonly sessionId: string) {}

  info(message: string): Promise<void> {
    appendLog(this.sessionId, createLogEntry('info', message))
    return Promise.resolve()
  }

  command(message: string): Promise<void> {
    appendLog(this.sessionId, createLogEntry('command', `$ ${message}`))
    return Promise.resolve()
  }

  error(message: string): Promise<void> {
    appendLog(this.sessionId, createLogEntry('error', message))
    return Promise.resolve()
  }

  success(message: string): Promise<void> {
    appendLog(this.sessionId, createLogEntry('success', message))
    return Promise.resolve()
  }
}

export function createSessionLogger(sessionId: string): SessionLogger {
  return new SessionLogger(sessionId)
}
