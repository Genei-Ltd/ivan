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
    <div className="flex gap-2 overflow-x-auto px-1 pt-1 pb-2">
      {attachments.map((attachment, index) => (
        <div
          key={attachment.id}
          className="relative size-12 shrink-0 sm:size-14"
          title={`${attachment.file.name || `Image ${String(index + 1)}`} · ${formatBytes(
            attachment.file.size,
          )}`}
        >
          <div
            aria-label={attachment.file.name || `Image ${String(index + 1)}`}
            role="img"
            className="bg-muted size-full rounded-xl border bg-cover bg-center shadow-sm"
            style={{ backgroundImage: imageBackground(attachment.url) }}
          />
          <button
            type="button"
            disabled={disabled}
            aria-label="Remove image"
            className={cn(
              'bg-background/95 text-foreground absolute top-1 right-1 flex size-5 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm',
              'transition-colors hover:bg-background disabled:opacity-50',
            )}
            onClick={() => {
              onRemove(attachment.id)
            }}
          >
            <XIcon className="size-3" />
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

  const columnCount = Math.min(attachments.length, 3)

  return (
    <div
      className={cn(
        'mt-2 grid w-fit gap-1.5',
        columnCount === 1 && 'grid-cols-1',
        columnCount === 2 && 'grid-cols-2',
        columnCount === 3 && 'grid-cols-3',
      )}
    >
      {attachments.map((attachment, index) => (
        <a
          key={attachment.id}
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          title={`${attachment.name} · ${formatBytes(attachment.size)}`}
          className="focus-visible:ring-ring bg-muted size-20 rounded-lg border bg-cover bg-center outline-none transition-opacity hover:opacity-80 focus-visible:ring-2"
          style={{ backgroundImage: imageBackground(attachment.url) }}
          aria-label={`Open ${attachment.name || `image ${String(index + 1)}`}`}
        />
      ))}
    </div>
  )
}
