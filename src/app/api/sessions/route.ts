import { NextResponse } from 'next/server'
import { createSession } from '@/lib/shell/manager'
import { listSessions } from '@/lib/shell/store'
import { parseAgentRequest } from '@/lib/shell/request'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const parsed = await parseAgentRequest(request, 'prompt')
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  try {
    const session = createSession(parsed.content, parsed.attachments)
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
