import { ExternalLinkIcon, Loader2Icon, TerminalIcon } from 'lucide-react'
import type { LogEntry, SessionStatus } from '@/lib/shell/types'
import { Button } from '@/components/ui/button'
import { ActivityLog } from '@/components/workspace/workspace-activity'
import { STATUS_LABEL } from '@/components/workspace/workspace-status'

export function WorkspacePreview({
  logs,
  previewUrl,
  status,
}: {
  logs: LogEntry[]
  previewUrl?: string
  status: SessionStatus | 'connecting'
}) {
  return (
    <main className="relative flex size-full flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
        <span className="text-sm font-medium">Preview</span>
        {previewUrl && (
          <Button asChild variant="ghost" size="sm">
            <a href={previewUrl} target="_blank" rel="noreferrer">
              Open
              <ExternalLinkIcon className="size-4" />
            </a>
          </Button>
        )}
      </header>
      <div className="relative flex-1">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            title="Live preview"
            className="size-full border-0"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
            <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
            <p className="text-muted-foreground text-sm">
              {STATUS_LABEL[status]}… the preview appears once the dev server is
              up.
            </p>
            <div className="bg-muted/40 flex h-56 min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-lg border text-left shadow-xs">
              <div className="text-muted-foreground flex h-10 shrink-0 items-center gap-2 border-b px-4 text-xs">
                <TerminalIcon className="size-3.5" />
                Activity ({logs.length})
              </div>
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
