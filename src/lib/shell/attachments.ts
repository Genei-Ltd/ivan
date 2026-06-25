import { randomUUID } from 'node:crypto'
import {
  MAX_IMAGE_ATTACHMENTS,
  MAX_IMAGE_BYTES,
  formatBytes,
  imageExtension,
  isSupportedImageMime,
  mimeTypeFromFilename,
} from '@/lib/image-attachments'
import type { ChatImageAttachment } from './types'

export const SANDBOX_IMAGE_DIR = '/vercel/sandbox/ivan-attachments'

export interface UploadedImageAttachment {
  id: string
  name: string
  mimeType: string
  size: number
  data: Uint8Array<ArrayBuffer>
}

export interface PreparedImageAttachment extends UploadedImageAttachment {
  path: string
}

export class ImageAttachmentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageAttachmentError'
  }
}

function safeDisplayName(name: string, index: number): string {
  const trimmed = name.trim()
  return trimmed || `image-${String(index + 1)}.png`
}

export function attachmentUrl(sessionId: string, attachmentId: string): string {
  return `/api/sessions/${sessionId}/attachments/${attachmentId}`
}

export function toChatImageAttachment(
  sessionId: string,
  attachment: UploadedImageAttachment,
): ChatImageAttachment {
  return {
    id: attachment.id,
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
    url: attachmentUrl(sessionId, attachment.id),
  }
}

export function sandboxImagePath(
  sessionId: string,
  attachment: UploadedImageAttachment,
): string {
  return `${SANDBOX_IMAGE_DIR}/${sessionId}/${attachment.id}.${imageExtension(
    attachment.mimeType,
  )}`
}

export async function imageAttachmentFromFile(
  file: File,
  index: number,
): Promise<UploadedImageAttachment> {
  const name = safeDisplayName(file.name, index)
  const fileMimeType = file.type.toLowerCase()
  const mimeType = fileMimeType
    ? fileMimeType
    : (mimeTypeFromFilename(name)?.toLowerCase() ?? '')

  if (!isSupportedImageMime(mimeType)) {
    throw new ImageAttachmentError(
      `${name} is not a supported image type. Use PNG, JPEG, WebP, or GIF.`,
    )
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageAttachmentError(
      `${name} is too large. The limit is ${formatBytes(MAX_IMAGE_BYTES)}.`,
    )
  }

  const arrayBuffer = await file.arrayBuffer()
  return {
    id: randomUUID(),
    name,
    mimeType,
    size: file.size,
    data: new Uint8Array(arrayBuffer),
  }
}

export function assertImageAttachmentCount(count: number): void {
  if (count > MAX_IMAGE_ATTACHMENTS) {
    throw new ImageAttachmentError(
      `Attach up to ${String(MAX_IMAGE_ATTACHMENTS)} images at a time.`,
    )
  }
}

export function imageAttachmentPrompt(
  instruction: string,
  attachments: PreparedImageAttachment[],
): string {
  if (attachments.length === 0) {
    return instruction
  }

  const imageList = attachments
    .map(
      (attachment, index) =>
        `[Image #${String(index + 1)}: ${attachment.name}] ${attachment.path}`,
    )
    .join('\n')

  return `${instruction}

Attached images for visual context:
${imageList}

Use these image paths as context for this turn.`
}
