import {
  ImageAttachmentError,
  assertImageAttachmentCount,
  imageAttachmentFromFile,
  type UploadedImageAttachment,
} from './attachments'

type AgentRequestField = 'prompt' | 'content'

export type AgentRequestParseResult =
  | {
      ok: true
      content: string
      attachments: UploadedImageAttachment[]
    }
  | {
      ok: false
      status: number
      error: string
    }

function isFileEntry(value: FormDataEntryValue): value is File {
  return typeof value !== 'string'
}

function contentFromJson(body: unknown, field: AgentRequestField): string {
  if (typeof body !== 'object' || body === null) {
    return ''
  }
  const record = body as Partial<Record<AgentRequestField, unknown>>
  const value = record[field]
  return typeof value === 'string' ? value.trim() : ''
}

export async function parseAgentRequest(
  request: Request,
  field: AgentRequestField,
): Promise<AgentRequestParseResult> {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return { ok: false, status: 400, error: 'Invalid form body' }
    }

    const rawContent = formData.get(field)
    const content =
      typeof rawContent === 'string' ? rawContent.trim() : undefined
    if (!content) {
      return {
        ok: false,
        status: 400,
        error:
          field === 'prompt'
            ? 'A non-empty prompt is required'
            : 'A non-empty message is required',
      }
    }

    const files = formData.getAll('images').filter(isFileEntry)
    try {
      assertImageAttachmentCount(files.length)
      const attachments = await Promise.all(
        files.map((file, index) => imageAttachmentFromFile(file, index)),
      )
      return { ok: true, content, attachments }
    } catch (error) {
      if (error instanceof ImageAttachmentError) {
        return { ok: false, status: 400, error: error.message }
      }
      return { ok: false, status: 400, error: 'Invalid image attachment' }
    }
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON body' }
  }

  const content = contentFromJson(body, field)
  if (!content) {
    return {
      ok: false,
      status: 400,
      error:
        field === 'prompt'
          ? 'A non-empty prompt is required'
          : 'A non-empty message is required',
    }
  }

  return { ok: true, content, attachments: [] }
}
