import { maybeAutoResumeSession } from '@/lib/shell/manager'
import { ensureSessionLoaded, subscribe } from '@/lib/shell/store'
import type { ShellEvent } from '@/lib/shell/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Server-sent events: replay buffered history, then stream live events. The
// stream is torn down (heartbeat cleared, store unsubscribed) when the client
// disconnects and the ReadableStream is cancelled.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await ensureSessionLoaded(id)
  const encoder = new TextEncoder()

  let ping: ReturnType<typeof setInterval> | undefined
  let unsubscribe: () => void = () => {
    /* replaced once subscribed */
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: ShellEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          )
        } catch {
          // controller closed
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

      ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          // controller closed
        }
      }, 15000)

      void maybeAutoResumeSession(id)
    },
    cancel() {
      if (ping) {
        clearInterval(ping)
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
