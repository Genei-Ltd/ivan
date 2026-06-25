'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useImageAttachments } from '@/hooks/use-image-attachments'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useSessionStream } from '@/hooks/use-session-stream'
import type { SessionStatus } from '@/lib/shell/types'
import {
  ActivityLog,
  ActivityToggle,
} from '@/components/workspace/workspace-activity'
import { WorkspaceComposer } from '@/components/workspace/workspace-composer'
import { WorkspaceHeader } from '@/components/workspace/workspace-header'
import { WorkspaceMessages } from '@/components/workspace/workspace-messages'
import { WorkspacePreview } from '@/components/workspace/workspace-preview'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/sonner'

function isBusy(status: SessionStatus | 'connecting'): boolean {
  return (
    status === 'creating' ||
    status === 'working' ||
    status === 'submitting' ||
    status === 'connecting'
  )
}

const DESKTOP_CHAT_DEFAULT_SIZE = '400px'
const DESKTOP_CHAT_MIN_SIZE = '352px'
const DESKTOP_LAYOUT_QUERY = '(min-width: 768px)'

export function Workspace({ id }: { id: string }) {
  const state = useSessionStream(id)
  const [input, setInput] = useState('')
  const [posting, setPosting] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const isDesktop = useMediaQuery(DESKTOP_LAYOUT_QUERY)
  const imageAttachments = useImageAttachments()

  // Keep the sandbox alive while this workspace is open. Heartbeat every 2
  // minutes, well inside the server's 5-minute keepalive window, so a missed
  // beat does not kill it; when the tab closes the sandbox frees itself within
  // the window.
  useEffect(() => {
    const ping = () => {
      void fetch(`/api/sessions/${id}/keepalive`, { method: 'POST' })
    }
    ping()
    const interval = setInterval(ping, 2 * 60 * 1000)
    return () => {
      clearInterval(interval)
    }
  }, [id])

  const busy = isBusy(state.status)
  const mainPanelOrientation = isDesktop ? 'horizontal' : 'vertical'

  async function send() {
    const content = input.trim()
    if (!content || busy || posting) {
      return
    }
    setPosting(true)
    setInput('')
    try {
      const formData = new FormData()
      formData.append('content', content)
      for (const attachment of imageAttachments.attachments) {
        formData.append('images', attachment.file, attachment.file.name)
      }

      const res = await fetch(`/api/sessions/${id}/messages`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to send')
      }
      imageAttachments.clearAttachments()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send message',
      )
      setInput(content)
    } finally {
      setPosting(false)
    }
  }

  async function submit() {
    if (busy || posting) {
      return
    }
    setPosting(true)
    try {
      const res = await fetch(`/api/sessions/${id}/submit`, { method: 'POST' })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to submit')
      }
      toast.info('Opening a pull request…')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit')
    } finally {
      setPosting(false)
    }
  }

  if (state.notFound) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">Session not found</h1>
        <p className="text-muted-foreground">It may have been torn down.</p>
        <Button asChild variant="outline">
          <Link href="/">Start a new session</Link>
        </Button>
      </div>
    )
  }

  const messages = (
    <WorkspaceMessages error={state.error} messages={state.messages} />
  )
  const activityToggle = (
    <ActivityToggle
      active={busy}
      logCount={state.logs.length}
      onToggle={() => {
        setShowLogs((v) => !v)
      }}
    />
  )

  return (
    <div className="h-svh">
      <ResizablePanelGroup
        key={mainPanelOrientation}
        orientation={mainPanelOrientation}
        className="h-svh"
      >
        <ResizablePanel
          defaultSize={isDesktop ? DESKTOP_CHAT_DEFAULT_SIZE : '50%'}
          minSize={isDesktop ? DESKTOP_CHAT_MIN_SIZE : '30%'}
          maxSize={isDesktop ? '72%' : '75%'}
          className="min-h-0 min-w-0"
        >
          <aside className="flex size-full flex-col border-b md:border-r md:border-b-0">
            <WorkspaceHeader busy={busy} status={state.status} />

            {showLogs ? (
              <ResizablePanelGroup
                orientation="vertical"
                className="min-h-0 flex-1"
              >
                <ResizablePanel
                  defaultSize="78%"
                  minSize="35%"
                  className="min-h-0"
                >
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
                    <ActivityLog logs={state.logs} />
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

            <WorkspaceComposer
              busy={busy}
              imageAttachments={imageAttachments}
              input={input}
              posting={posting}
              prUrl={state.prUrl}
              status={state.status}
              onInputChange={setInput}
              onSend={() => void send()}
              onSubmit={() => void submit()}
            />
          </aside>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel
          defaultSize={isDesktop ? undefined : '50%'}
          minSize={isDesktop ? DESKTOP_CHAT_MIN_SIZE : '25%'}
          className="min-h-0 min-w-0"
        >
          <WorkspacePreview
            logs={state.logs}
            previewUrl={state.previewUrl}
            status={state.status}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <Toaster />
    </div>
  )
}
