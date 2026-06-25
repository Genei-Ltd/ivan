'use client'

import { useEffect, useRef, useState } from 'react'
import type { ClipboardEvent, DragEvent } from 'react'
import { toast } from 'sonner'
import {
  MAX_IMAGE_ATTACHMENTS,
  MAX_IMAGE_BYTES,
  formatBytes,
  imageExtension,
  isSupportedImageMime,
  mimeTypeFromFilename,
} from '@/lib/image-attachments'

export interface PendingImageAttachment {
  id: string
  file: File
  url: string
}

function browserId(): string {
  return crypto.randomUUID()
}

function fileMimeType(file: File): string {
  const mimeType = file.type.toLowerCase()
  if (mimeType) {
    return mimeType
  }
  return mimeTypeFromFilename(file.name)?.toLowerCase() ?? ''
}

function normalizeImageMime(mimeType: string): string {
  const normalizedMimeType = mimeType.toLowerCase()
  return normalizedMimeType === 'image/jpg' ? 'image/jpeg' : normalizedMimeType
}

function fileFromBase64(
  base64: string,
  mimeType: string,
  index: number,
): File | undefined {
  const normalizedMimeType = normalizeImageMime(mimeType)
  const cleanBase64 = base64.replace(/\s/g, '')
  if (!isSupportedImageMime(normalizedMimeType) || !cleanBase64) {
    return undefined
  }

  try {
    const binary = atob(cleanBase64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new File(
      [bytes],
      `pasted-image-${String(index + 1)}.${imageExtension(normalizedMimeType)}`,
      { type: normalizedMimeType },
    )
  } catch {
    return undefined
  }
}

function addBase64File(
  base64: string,
  mimeType: string,
  files: File[],
  seenPayloads: Set<string>,
) {
  const normalizedMimeType = normalizeImageMime(mimeType)
  const cleanBase64 = base64.replace(/\s/g, '')
  const payloadKey = `${normalizedMimeType}:${cleanBase64}`
  if (seenPayloads.has(payloadKey)) {
    return
  }

  const file = fileFromBase64(cleanBase64, normalizedMimeType, files.length)
  if (file) {
    seenPayloads.add(payloadKey)
    files.push(file)
  }
}

function inferBase64ImageMime(value: string): string | undefined {
  const cleanValue = value.trim()
  if (cleanValue.startsWith('iVBORw0KGgo')) {
    return 'image/png'
  }
  if (cleanValue.startsWith('/9j/')) {
    return 'image/jpeg'
  }
  if (cleanValue.startsWith('R0lGOD')) {
    return 'image/gif'
  }
  if (cleanValue.startsWith('UklGR')) {
    return 'image/webp'
  }
  return undefined
}

function collectDataUrls(text: string): string[] {
  const urls: string[] = []
  const dataUrlPattern =
    /data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\s]+/gi
  for (const match of text.matchAll(dataUrlPattern)) {
    urls.push(match[0])
  }
  return urls
}

function collectJsonImages(
  value: unknown,
  files: File[],
  seenPayloads: Set<string>,
): void {
  if (files.length >= MAX_IMAGE_ATTACHMENTS) {
    return
  }

  if (typeof value === 'string') {
    for (const dataUrl of collectDataUrls(value)) {
      addDataUrlFile(dataUrl, files, seenPayloads)
      if (files.length >= MAX_IMAGE_ATTACHMENTS) {
        return
      }
    }
    return
  }

  if (!value || typeof value !== 'object') {
    return
  }

  const record = value as Record<string, unknown>
  const rawData = record.data ?? record.base64
  const rawMimeType =
    record.mimeType ??
    record.mediaType ??
    record.media_type ??
    record.mime ??
    record.type
  if (typeof rawData === 'string') {
    if (rawData.startsWith('data:')) {
      addDataUrlFile(rawData, files, seenPayloads)
    } else {
      const explicitMimeType =
        typeof rawMimeType === 'string'
          ? normalizeImageMime(rawMimeType)
          : undefined
      const mimeType = explicitMimeType?.startsWith('image/')
        ? explicitMimeType
        : inferBase64ImageMime(rawData)
      if (mimeType) {
        addBase64File(rawData, mimeType, files, seenPayloads)
      }
    }
  }

  for (const child of Object.values(record)) {
    collectJsonImages(child, files, seenPayloads)
    if (files.length >= MAX_IMAGE_ATTACHMENTS) {
      return
    }
  }
}

function addDataUrlFile(
  dataUrl: string,
  files: File[],
  seenPayloads: Set<string>,
) {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl.trim())
  if (!match) {
    return
  }

  addBase64File(match[2], match[1], files, seenPayloads)
}

function extractTextImageFiles(dataTransfer: DataTransfer): File[] {
  const files: File[] = []
  const seenPayloads = new Set<string>()
  const clipboardText = [
    dataTransfer.getData('text/html'),
    dataTransfer.getData('text/plain'),
  ].join('\n')

  for (const dataUrl of collectDataUrls(clipboardText)) {
    addDataUrlFile(dataUrl, files, seenPayloads)
    if (files.length >= MAX_IMAGE_ATTACHMENTS) {
      return files
    }
  }

  const plainText = dataTransfer.getData('text/plain').trim()
  if (!plainText) {
    return files
  }

  try {
    collectJsonImages(JSON.parse(plainText) as unknown, files, seenPayloads)
  } catch {
    const mimeType = inferBase64ImageMime(plainText)
    if (mimeType) {
      addBase64File(plainText, mimeType, files, seenPayloads)
    }
  }

  return files
}

function uniqueImageFiles(files: File[]): File[] {
  const seen = new Set<string>()
  const imageFiles: File[] = []

  for (const file of files) {
    const mimeType = fileMimeType(file)
    if (!mimeType.startsWith('image/')) {
      continue
    }

    const key = `${mimeType}:${String(file.size)}:${file.name}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    imageFiles.push(file)
  }

  return imageFiles
}

function extractImageFiles(
  dataTransfer: DataTransfer,
  options: { dedupeFiles?: boolean; includeTextPayloads?: boolean } = {},
): File[] {
  const itemFiles = Array.from(dataTransfer.items)
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file))

  const files =
    itemFiles.length > 0 ? itemFiles : Array.from(dataTransfer.files)
  const imageFiles = options.dedupeFiles
    ? uniqueImageFiles(files)
    : files.filter((file) => fileMimeType(file).startsWith('image/'))

  if (!options.includeTextPayloads || imageFiles.length > 0) {
    return imageFiles
  }

  return extractTextImageFiles(dataTransfer)
}

export function useImageAttachments() {
  const [attachments, setAttachments] = useState<PendingImageAttachment[]>([])
  const [dragging, setDragging] = useState(false)
  const attachmentsRef = useRef<PendingImageAttachment[]>(attachments)

  useEffect(() => {
    attachmentsRef.current = attachments
  }, [attachments])

  useEffect(() => {
    return () => {
      for (const attachment of attachmentsRef.current) {
        URL.revokeObjectURL(attachment.url)
      }
    }
  }, [])

  function setNextAttachments(next: PendingImageAttachment[]) {
    attachmentsRef.current = next
    setAttachments(next)
  }

  function addFiles(files: File[]) {
    if (files.length === 0) {
      return
    }

    const next = [...attachmentsRef.current]
    for (const file of files) {
      if (next.length >= MAX_IMAGE_ATTACHMENTS) {
        toast.error(
          `Attach up to ${String(MAX_IMAGE_ATTACHMENTS)} images at a time.`,
        )
        break
      }

      const mimeType = fileMimeType(file)
      if (!isSupportedImageMime(mimeType)) {
        toast.error(
          `${file.name || 'This file'} is not a supported image type.`,
        )
        continue
      }

      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(
          `${file.name || 'This image'} is too large. The limit is ${formatBytes(
            MAX_IMAGE_BYTES,
          )}.`,
        )
        continue
      }

      next.push({
        id: browserId(),
        file,
        url: URL.createObjectURL(file),
      })
    }

    setNextAttachments(next)
  }

  function removeAttachment(id: string) {
    const target = attachmentsRef.current.find(
      (attachment) => attachment.id === id,
    )
    if (target) {
      URL.revokeObjectURL(target.url)
    }
    setNextAttachments(
      attachmentsRef.current.filter((attachment) => attachment.id !== id),
    )
  }

  function clearAttachments() {
    for (const attachment of attachmentsRef.current) {
      URL.revokeObjectURL(attachment.url)
    }
    setNextAttachments([])
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const files = extractImageFiles(event.clipboardData, {
      dedupeFiles: true,
      includeTextPayloads: true,
    })
    if (files.length === 0) {
      return
    }
    event.preventDefault()
    addFiles(files)
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (extractImageFiles(event.dataTransfer).length === 0) {
      return
    }
    event.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDragging(false)
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    const files = extractImageFiles(event.dataTransfer)
    if (files.length === 0) {
      return
    }
    event.preventDefault()
    setDragging(false)
    addFiles(files)
  }

  return {
    addFiles,
    attachments,
    clearAttachments,
    dragging,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handlePaste,
    removeAttachment,
  }
}
