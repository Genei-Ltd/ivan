import { after, NextResponse } from 'next/server'
import { ensureSessionLoaded } from '@/lib/shell/store'
import { recordUserMessage, runRecordedMessageTurn } from '@/lib/shell/manager'
import { parseAgentRequest } from '@/lib/shell/request'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!(await ensureSessionLoaded(id))) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const parsed = await parseAgentRequest(request, 'content')
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  // Persist and stream the user bubble before responding; otherwise a
  // serverless instance split can make the message appear only after reload.
  await recordUserMessage(id, parsed.content, parsed.attachments)
  after(() => runRecordedMessageTurn(id, parsed.content, parsed.attachments))

  return NextResponse.json({ ok: true }, { status: 202 })
}
