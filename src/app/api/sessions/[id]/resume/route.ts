import { NextResponse } from 'next/server'
import { ensureSessionLoaded } from '@/lib/shell/store'
import { resumeSession } from '@/lib/shell/manager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!(await ensureSessionLoaded(id))) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Resume and preview restart stream progress over SSE.
  void resumeSession(id)

  return NextResponse.json({ ok: true }, { status: 202 })
}
