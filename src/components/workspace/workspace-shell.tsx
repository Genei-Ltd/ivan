import type { ReactNode } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

const DESKTOP_CHAT_DEFAULT_SIZE = '400px'
const DESKTOP_CHAT_MIN_SIZE = '352px'

export function WorkspaceShell({
  chatPanel,
  isDesktop,
  previewPanel,
}: {
  chatPanel: ReactNode
  isDesktop: boolean
  previewPanel: ReactNode
}) {
  const orientation = isDesktop ? 'horizontal' : 'vertical'

  return (
    <ResizablePanelGroup
      key={orientation}
      orientation={orientation}
      className="h-svh"
    >
      <ResizablePanel
        defaultSize={isDesktop ? DESKTOP_CHAT_DEFAULT_SIZE : '50%'}
        minSize={isDesktop ? DESKTOP_CHAT_MIN_SIZE : '30%'}
        maxSize={isDesktop ? '72%' : '75%'}
        className="min-h-0 min-w-0"
      >
        {chatPanel}
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel
        defaultSize={isDesktop ? undefined : '50%'}
        minSize={isDesktop ? DESKTOP_CHAT_MIN_SIZE : '25%'}
        className="min-h-0 min-w-0"
      >
        {previewPanel}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
