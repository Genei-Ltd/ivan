'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useImageAttachments } from '@/hooks/use-image-attachments'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useSessionStream } from '@/hooks/use-session-stream'
import type { SessionStatus } from '@/lib/shell/types'
import { ActivityToggle } from '@/components/workspace/workspace-activity'
import { WorkspaceChatPanel } from '@/components/workspace/workspace-chat-panel'
import { WorkspaceComposer } from '@/components/workspace/workspace-composer'
import { WorkspaceMessages } from '@/components/workspace/workspace-messages'
import { WorkspaceNotFound } from '@/components/workspace/workspace-not-found'
import { WorkspacePreview } from '@/components/workspace/workspace-preview'
import { WorkspaceShell } from '@/components/workspace/workspace-shell'
import { Toaster } from '@/components/ui/sonner'

function isBusy(status: SessionStatus | 'connecting'): boolean {
  return (
    status === 'creating' ||
    status === 'resuming' ||
    status === 'working' ||
    status === 'submitting' ||
    status === 'connecting'
  )
}

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

  async function send() {
    const content = input.trim()
    if (
      (!content && imageAttachments.attachments.length === 0) ||
      busy ||
      posting
    ) {
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

  async function resume() {
    if (busy || posting) {
      return
    }
    setPosting(true)
    try {
      const res = await fetch(`/api/sessions/${id}/resume`, { method: 'POST' })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to resume')
      }
      toast.info('Resuming sandbox…')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resume')
    } finally {
      setPosting(false)
    }
  }

  if (state.notFound) {
    return <WorkspaceNotFound />
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
  const composer = (
    <WorkspaceComposer
      busy={busy}
      imageAttachments={imageAttachments}
      input={input}
      posting={posting}
      prUrl={state.prUrl}
      status={state.status}
      onInputChange={setInput}
      onResume={() => void resume()}
      onSend={() => void send()}
      onSubmit={() => void submit()}
    />
  )

  return (
    <div className="h-svh">
      <WorkspaceShell
        chatPanel={
          <WorkspaceChatPanel
            activityToggle={activityToggle}
            busy={busy}
            composer={composer}
            logs={state.logs}
            messages={messages}
            showLogs={showLogs}
            status={state.status}
          />
        }
        isDesktop={isDesktop}
        previewPanel={
          <WorkspacePreview
            logs={state.logs}
            onResume={() => void resume()}
            previewUrl={state.previewUrl}
            previewVersion={state.previewVersion}
            resumeDisabled={busy || posting}
            status={state.status}
          />
        }
      />

      <Toaster />
    </div>
  )
}
