import { NextResponse } from 'next/server'
import { getSession } from '@/lib/shell/store'
import { sendMessage } from '@/lib/shell/manager'
import { parseAgentRequest } from '@/lib/shell/request'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!getSession(id)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const parsed = await parseAgentRequest(request, 'content')
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  // The agent turn is long-running; progress streams over SSE. Fire and forget;
  // failures surface to the client as SSE error events.
  void sendMessage(id, parsed.content, parsed.attachments)

  return NextResponse.json({ ok: true }, { status: 202 })
}
