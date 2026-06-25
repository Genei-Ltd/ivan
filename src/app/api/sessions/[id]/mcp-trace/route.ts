import { NextResponse } from 'next/server'
import { getSandbox, getSession } from '@/lib/shell/store'
import { runCommandInSandbox } from '@/lib/shell/commands'
import { SANDBOX_MCP_TRACE_PATH } from '@/lib/shell/mcp-proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Exfil the MCP trace file the logging proxy wrote inside the sandbox. The
// trace contains the real Aiven JSON-RPC traffic for the session, including
// connection credentials, so treat the download as sensitive.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!getSession(id)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const sandbox = getSandbox(id)
  if (!sandbox) {
    return NextResponse.json(
      { error: 'No active sandbox for session' },
      { status: 409 },
    )
  }

  const result = await runCommandInSandbox(sandbox, 'cat', [
    SANDBOX_MCP_TRACE_PATH,
  ])
  if (!result.success) {
    return NextResponse.json(
      {
        error:
          'No trace found. Enable IVAN_MCP_TRACE=true and run a turn that uses the Aiven MCP first.',
      },
      { status: 404 },
    )
  }

  return new Response(result.output ?? '', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="aiven-mcp-trace.jsonl"',
      'Cache-Control': 'no-store',
    },
  })
}
