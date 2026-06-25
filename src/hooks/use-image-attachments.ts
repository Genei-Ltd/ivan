'use client'

import { useEffect, useRef, useState } from 'react'
import type { ClipboardEvent, DragEvent } from 'react'
import { toast } from 'sonner'
import {
  MAX_IMAGE_ATTACHMENTS,
  MAX_IMAGE_BYTES,
  formatBytes,
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

function extractImageFiles(dataTransfer: DataTransfer): File[] {
  const itemFiles = Array.from(dataTransfer.items)
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file))

  const files =
    itemFiles.length > 0 ? itemFiles : Array.from(dataTransfer.files)
  return files.filter((file) => fileMimeType(file).startsWith('image/'))
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
    const files = extractImageFiles(event.clipboardData)
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
