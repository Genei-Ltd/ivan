import { NextResponse } from 'next/server'
import {
  ensureImageAttachmentLoaded,
  ensureSessionLoaded,
} from '@/lib/shell/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function contentDisposition(filename: string): string {
  return `inline; filename*=UTF-8''${encodeURIComponent(filename)}`
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const { id, attachmentId } = await params
  if (!(await ensureSessionLoaded(id))) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const attachment = await ensureImageAttachmentLoaded(id, attachmentId)
  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  return new Response(attachment.data, {
    headers: {
      'Cache-Control': 'private, max-age=3600',
      'Content-Disposition': contentDisposition(attachment.name),
      'Content-Length': String(attachment.size),
      'Content-Type': attachment.mimeType,
    },
  })
}
