import { ExternalLinkIcon, Loader2Icon, RotateCcwIcon } from 'lucide-react'
import type { LogEntry, SessionStatus } from '@/lib/shell/types'
import { Button } from '@/components/ui/button'
import { ActivityLog } from '@/components/workspace/workspace-activity'
import { STATUS_LABEL } from '@/components/workspace/workspace-status'

export function WorkspacePreview({
  logs,
  onResume,
  previewUrl,
  previewVersion,
  resumeDisabled,
  status,
}: {
  logs: LogEntry[]
  onResume: () => void
  previewUrl?: string
  previewVersion: number
  resumeDisabled: boolean
  status: SessionStatus | 'connecting'
}) {
  const canResume = status === 'stopped' || status === 'error'

  return (
    <main className="relative flex size-full flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
        <span className="text-sm font-medium">Preview</span>
        <div className="flex items-center gap-1">
          {previewUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResume}
              disabled={resumeDisabled}
            >
              Resume
              <RotateCcwIcon className="size-4" />
            </Button>
          )}
          {previewUrl && (
            <Button asChild variant="ghost" size="sm">
              <a href={previewUrl} target="_blank" rel="noreferrer">
                Open
                <ExternalLinkIcon className="size-4" />
              </a>
            </Button>
          )}
        </div>
      </header>
      <div className="relative flex-1">
        {previewUrl ? (
          <iframe
            key={`${previewUrl}:${String(previewVersion)}`}
            src={previewUrl}
            title="Live preview"
            className="size-full border-0"
          />
        ) : (
          <div className="flex h-full min-h-0 flex-col items-center gap-3 overflow-hidden p-8">
            <div className="flex shrink-0 flex-col items-center gap-3">
              <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
              <p className="text-muted-foreground text-sm">
                {STATUS_LABEL[status]}… the preview appears once the dev server
                is up.
              </p>
              {canResume && (
                <Button onClick={onResume} disabled={resumeDisabled}>
                  <RotateCcwIcon className="size-4" />
                  Resume sandbox
                </Button>
              )}
            </div>
            <div className="bg-muted/40 flex min-h-56 w-full flex-1 flex-col overflow-hidden rounded-lg border text-left shadow-xs">
              <ActivityLog
                className="border-t-0 bg-background/70"
                contentClassName="py-3"
                logs={logs}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
