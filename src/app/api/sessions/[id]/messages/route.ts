import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/shell/store'
import { sendMessage } from '@/lib/shell/manager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({ content: z.string().min(1) })

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!getSession(id)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'A non-empty message is required' },
      { status: 400 },
    )
  }

  // The agent turn is long-running; progress streams over SSE. Fire and forget;
  // failures surface to the client as SSE error events.
  void sendMessage(id, parsed.data.content)

  return NextResponse.json({ ok: true }, { status: 202 })
}
