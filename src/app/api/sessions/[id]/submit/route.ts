import { NextResponse } from 'next/server'
import { getSession } from '@/lib/shell/store'
import { submitSession } from '@/lib/shell/manager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!getSession(id)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Push + PR streams progress over SSE. Fire and forget; failures surface to
  // the client as SSE error events.
  void submitSession(id)

  return NextResponse.json({ ok: true }, { status: 202 })
}
