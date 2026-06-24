import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSession } from '@/lib/shell/manager'
import { listSessions } from '@/lib/shell/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createSchema = z.object({ prompt: z.string().min(1) })

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'A non-empty prompt is required' },
      { status: 400 },
    )
  }

  try {
    const session = createSession(parsed.data.prompt)
    return NextResponse.json({ id: session.id }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create session',
      },
      { status: 500 },
    )
  }
}

export function GET() {
  return NextResponse.json({ sessions: listSessions() })
}
