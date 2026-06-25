import { maybeAutoResumeSession } from '@/lib/shell/manager'
import { loadSession } from '@/lib/shell/persistence'
import { ensureSessionLoaded, subscribe } from '@/lib/shell/store'
import type { ChatMessage, ShellEvent } from '@/lib/shell/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Server-sent events: replay buffered history, then stream live events. The
// stream is torn down (heartbeat cleared, store unsubscribed) when the client
// disconnects and the ReadableStream is cancelled.

interface SeenEvents {
  status?: string
  messages: Map<string, string>
  logCount: number
  previewUrl?: string
  prUrl?: string
  error?: string
}

function messageKey(message: ChatMessage): string {
  return JSON.stringify(message)
}

function markSeen(seen: SeenEvents, event: ShellEvent): void {
  switch (event.kind) {
    case 'status':
      seen.status = event.status
      if (event.status !== 'error') {
        seen.error = undefined
      }
      break
    case 'message':
      seen.messages.set(event.message.id, messageKey(event.message))
      break
    case 'log':
      seen.logCount += 1
      break
    case 'preview':
      seen.previewUrl = event.url
      break
    case 'pr':
      seen.prUrl = event.url
      break
    case 'error':
      seen.error = event.message
      break
    case 'changes':
      break
  }
}

function timestamp(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await ensureSessionLoaded(id)
  const encoder = new TextEncoder()

  let ping: ReturnType<typeof setInterval> | undefined
  let poll: ReturnType<typeof setInterval> | undefined
  let polling = false
  let unsubscribe: () => void = () => {
    /* replaced once subscribed */
  }
  const seen: SeenEvents = {
    messages: new Map(),
    logCount: 0,
  }
  let latestSeenUpdatedAt = timestamp(session?.updatedAt) ?? 0

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: ShellEvent) => {
        markSeen(seen, event)
        const sessionUpdatedAt = timestamp(session?.updatedAt)
        if (sessionUpdatedAt) {
          latestSeenUpdatedAt = Math.max(latestSeenUpdatedAt, sessionUpdatedAt)
        }
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          )
        } catch {
          // controller closed
        }
      }
      const replayPersisted = async () => {
        if (polling) {
          return
        }
        polling = true
        try {
          const persisted = await loadSession(id)
          if (!persisted) {
            return
          }
          const snapshot = persisted.session
          const snapshotUpdatedAt = timestamp(snapshot.updatedAt)
          if (!snapshotUpdatedAt || snapshotUpdatedAt <= latestSeenUpdatedAt) {
            return
          }
          latestSeenUpdatedAt = snapshotUpdatedAt

          if (seen.status !== snapshot.status) {
            send({ kind: 'status', status: snapshot.status })
          }
          for (const message of snapshot.messages) {
            const key = messageKey(message)
            if (seen.messages.get(message.id) !== key) {
              send({ kind: 'message', message })
            }
          }
          for (const entry of snapshot.logs.slice(seen.logCount)) {
            send({ kind: 'log', entry })
          }
          if (snapshot.previewUrl && seen.previewUrl !== snapshot.previewUrl) {
            send({ kind: 'preview', url: snapshot.previewUrl })
          }
          if (snapshot.prUrl && seen.prUrl !== snapshot.prUrl) {
            send({ kind: 'pr', url: snapshot.prUrl })
          }
          if (snapshot.error && seen.error !== snapshot.error) {
            send({ kind: 'error', message: snapshot.error })
          }
        } catch (error: unknown) {
          send({
            kind: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Failed to refresh session state',
          })
        } finally {
          polling = false
        }
      }

      const sub = session ? subscribe(id, send) : undefined
      if (!sub) {
        controller.enqueue(encoder.encode('event: notfound\ndata: {}\n\n'))
        controller.close()
        return
      }
      unsubscribe = sub.unsubscribe

      for (const event of sub.history) {
        send(event)
      }

      void replayPersisted()
      ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          // controller closed
        }
      }, 15000)
      poll = setInterval(() => {
        void replayPersisted()
      }, 2000)

      void maybeAutoResumeSession(id)
    },
    cancel() {
      if (ping) {
        clearInterval(ping)
      }
      if (poll) {
        clearInterval(poll)
      }
      unsubscribe()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
