import type { ChangeEvent } from 'react'
import { GitPullRequestIcon, SendIcon } from 'lucide-react'
import type { SessionStatus } from '@/lib/shell/types'
import type { useImageAttachments } from '@/hooks/use-image-attachments'
import { cn } from '@/lib/utils'
import {
  ImageAttachmentPicker,
  PendingImageAttachments,
} from '@/components/workspace/image-attachments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function WorkspaceComposer({
  busy,
  imageAttachments,
  input,
  posting,
  prUrl,
  status,
  onInputChange,
  onSend,
  onSubmit,
}: {
  busy: boolean
  imageAttachments: ReturnType<typeof useImageAttachments>
  input: string
  posting: boolean
  prUrl?: string
  status: SessionStatus | 'connecting'
  onInputChange: (value: string) => void
  onSend: () => void
  onSubmit: () => void
}) {
  return (
    <div className="p-4">
      <div
        onDragOver={busy ? undefined : imageAttachments.handleDragOver}
        onDragLeave={busy ? undefined : imageAttachments.handleDragLeave}
        onDrop={busy ? undefined : imageAttachments.handleDrop}
        className={cn(
          'bg-card focus-within:border-ring/60 mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-2xl border p-2.5 transition-colors',
          imageAttachments.dragging && 'border-ring/70 bg-accent/20',
        )}
      >
        <PendingImageAttachments
          attachments={imageAttachments.attachments}
          disabled={busy || posting}
          onRemove={imageAttachments.removeAttachment}
        />
        <Textarea
          value={input}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
            onInputChange(event.target.value)
          }}
          onPaste={busy ? undefined : imageAttachments.handlePaste}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              onSend()
            }
          }}
          placeholder="Describe a change…"
          rows={2}
          disabled={busy}
          className="min-h-12 max-h-48 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ImageAttachmentPicker
              disabled={busy || posting}
              onFiles={imageAttachments.addFiles}
            />
            {prUrl ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <a href={prUrl} target="_blank" rel="noreferrer">
                  <GitPullRequestIcon className="size-4" />
                  View PR
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={onSubmit}
                disabled={busy || posting || status === 'connecting'}
              >
                <GitPullRequestIcon className="size-4" />
                Open PR
              </Button>
            )}
          </div>
          <Button
            size="sm"
            className="rounded-full"
            onClick={onSend}
            disabled={busy || posting || !input.trim()}
          >
            <SendIcon className="size-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
