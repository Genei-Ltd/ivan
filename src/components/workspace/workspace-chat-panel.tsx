import type { ReactNode } from 'react'
import type { LogEntry, SessionStatus } from '@/lib/shell/types'
import { ActivityLog } from '@/components/workspace/workspace-activity'
import { WorkspaceHeader } from '@/components/workspace/workspace-header'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Separator } from '@/components/ui/separator'

export function WorkspaceChatPanel({
  activityToggle,
  busy,
  composer,
  logs,
  messages,
  showLogs,
  status,
}: {
  activityToggle: ReactNode
  busy: boolean
  composer: ReactNode
  logs: LogEntry[]
  messages: ReactNode
  showLogs: boolean
  status: SessionStatus | 'connecting'
}) {
  return (
    <aside className="flex size-full flex-col border-b md:border-r md:border-b-0">
      <WorkspaceHeader busy={busy} status={status} />

      {showLogs ? (
        <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
          <ResizablePanel defaultSize="78%" minSize="35%" className="min-h-0">
            {messages}
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel
            defaultSize="22%"
            minSize="8rem"
            maxSize="55%"
            className="min-h-0"
          >
            <div className="flex size-full flex-col border-t">
              {activityToggle}
              <ActivityLog logs={logs} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <>
          {messages}
          <div className="border-t">{activityToggle}</div>
        </>
      )}

      <Separator />

      {composer}
    </aside>
  )
}
