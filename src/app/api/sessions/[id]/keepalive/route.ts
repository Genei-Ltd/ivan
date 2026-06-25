import { NextResponse } from 'next/server'
import { getSession } from '@/lib/shell/store'
import { keepSessionAlive } from '@/lib/shell/manager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Heartbeat from the open workspace: roll the sandbox's auto-terminate deadline
// forward so it stays alive while the page is watched.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!getSession(id)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  await keepSessionAlive(id)
  return NextResponse.json({ ok: true })
}
