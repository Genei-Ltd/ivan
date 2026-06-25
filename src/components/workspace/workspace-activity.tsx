import { TerminalIcon } from 'lucide-react'
import type { LogEntry } from '@/lib/shell/types'
import { useStickToBottom } from '@/hooks/use-stick-to-bottom'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ActivityToggle({
  active,
  logCount,
  onToggle,
}: {
  active: boolean
  logCount: number
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-busy={active}
      onClick={onToggle}
      className={cn(
        'flex min-h-10 w-full items-center gap-2 px-4 py-2 text-xs text-muted-foreground transition-[background-color,color] hover:text-foreground',
        active &&
          'animate-shimmer-reverse bg-[linear-gradient(90deg,transparent,color-mix(in_oklch,var(--color-brand-subtle)_35%,transparent),transparent)] bg-size-[200%_100%]',
      )}
    >
      <TerminalIcon
        className={cn(
          'size-3.5',
          active && 'animate-pulse text-muted-foreground/80',
        )}
      />
      <span>Activity</span>
      <span className="tabular-nums">({logCount})</span>
    </button>
  )
}

export function ActivityLog({
  className,
  contentClassName,
  logs,
}: {
  className?: string
  contentClassName?: string
  logs: LogEntry[]
}) {
  const { onViewportScroll, viewportRef } = useStickToBottom(logs)

  return (
    <ScrollArea
      className={cn('min-h-0 flex-1 border-t', className)}
      viewportRef={viewportRef}
      viewportProps={{ onScroll: onViewportScroll }}
    >
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
        <div aria-hidden="true" />
      </div>
    </ScrollArea>
  )
}
