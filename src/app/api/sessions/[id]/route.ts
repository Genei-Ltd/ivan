import { NextResponse } from 'next/server'
import { getSession } from '@/lib/shell/store'
import { teardownSession } from '@/lib/shell/manager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = getSession(id)
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  return NextResponse.json({ session })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!getSession(id)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  await teardownSession(id)
  return NextResponse.json({ ok: true })
}
