'use client'

import { useRef } from 'react'
import { ImagePlusIcon, XIcon } from 'lucide-react'
import { IMAGE_ACCEPT, formatBytes } from '@/lib/image-attachments'
import type { ChatImageAttachment } from '@/lib/shell/types'
import type { PendingImageAttachment } from '@/hooks/use-image-attachments'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function imageBackground(url: string): string {
  return `url("${url.replace(/"/g, '\\"')}")`
}

export function ImageAttachmentPicker({
  disabled,
  onFiles,
}: {
  disabled?: boolean
  onFiles: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="hidden"
        onChange={(event) => {
          onFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label="Attach images"
        className="size-8 rounded-full"
        onClick={() => {
          inputRef.current?.click()
        }}
      >
        <ImagePlusIcon className="size-4" />
      </Button>
    </>
  )
}

export function PendingImageAttachments({
  attachments,
  disabled,
  onRemove,
}: {
  attachments: PendingImageAttachment[]
  disabled?: boolean
  onRemove: (id: string) => void
}) {
  if (attachments.length === 0) {
    return null
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-1 pb-1">
      {attachments.map((attachment, index) => (
        <div
          key={attachment.id}
          className="group/image relative size-16 shrink-0"
          title={`${attachment.file.name || `Image ${String(index + 1)}`} · ${formatBytes(
            attachment.file.size,
          )}`}
        >
          <div
            aria-label={attachment.file.name || `Image ${String(index + 1)}`}
            role="img"
            className="bg-muted size-full rounded-lg border bg-cover bg-center"
            style={{ backgroundImage: imageBackground(attachment.url) }}
          />
          <button
            type="button"
            disabled={disabled}
            aria-label="Remove image"
            className={cn(
              'bg-background text-foreground absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border shadow-sm',
              'opacity-100 transition-opacity md:opacity-0 md:group-hover/image:opacity-100',
            )}
            onClick={() => {
              onRemove(attachment.id)
            }}
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

export function MessageImageAttachments({
  attachments,
}: {
  attachments?: ChatImageAttachment[]
}) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  return (
    <div className="mt-2 grid max-w-64 grid-cols-3 gap-1.5">
      {attachments.map((attachment, index) => (
        <a
          key={attachment.id}
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          title={`${attachment.name} · ${formatBytes(attachment.size)}`}
          className="focus-visible:ring-ring bg-muted aspect-square rounded-lg border bg-cover bg-center outline-none transition-opacity hover:opacity-80 focus-visible:ring-2"
          style={{ backgroundImage: imageBackground(attachment.url) }}
          aria-label={`Open ${attachment.name || `image ${String(index + 1)}`}`}
        />
      ))}
    </div>
  )
}
