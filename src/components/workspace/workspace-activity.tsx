import type { RefObject } from 'react'
import { TerminalIcon } from 'lucide-react'
import type { LogEntry } from '@/lib/shell/types'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ActivityToggle({
  logCount,
  onToggle,
}: {
  logCount: number
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 px-4 py-2 text-xs"
    >
      <TerminalIcon className="size-3.5" />
      Activity ({logCount})
    </button>
  )
}

export function ActivityLog({
  className,
  contentClassName,
  logEndRef,
  logs,
}: {
  className?: string
  contentClassName?: string
  logEndRef: RefObject<HTMLDivElement | null>
  logs: LogEntry[]
}) {
  return (
    <ScrollArea className={cn('min-h-0 flex-1 border-t', className)}>
      <div
        className={cn(
          'space-y-0.5 px-4 py-2 font-mono text-xs',
          contentClassName,
        )}
      >
        {logs.map((log, index) => (
          <div
            key={`${log.timestamp}-${String(index)}`}
            className={cn(
              'animate-log-entry wrap-break-word whitespace-pre-wrap',
              log.type === 'error' && 'text-destructive',
              log.type === 'command' && 'text-foreground',
              log.type === 'success' && 'text-green-600 dark:text-green-400',
              log.type === 'info' && 'text-muted-foreground',
            )}
          >
            {log.message}
          </div>
        ))}
        <div ref={logEndRef} aria-hidden="true" />
      </div>
    </ScrollArea>
  )
}
