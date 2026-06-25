'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ChevronRightIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GitPullRequestIcon,
  Loader2Icon,
  PencilIcon,
  SearchIcon,
  SendIcon,
  TerminalIcon,
  TriangleAlertIcon,
  WrenchIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSessionStream } from '@/hooks/use-session-stream'
import { useImageAttachments } from '@/hooks/use-image-attachments'
import type {
  ChatMessage,
  SessionStatus,
  ToolCallPart,
} from '@/lib/shell/types'
import { cn } from '@/lib/utils'
import { IvanLogo } from '@/components/layout/ivan-logo'
import {
  ImageAttachmentPicker,
  MessageImageAttachments,
  PendingImageAttachments,
} from '@/components/workspace/image-attachments'
import { Markdown } from '@/components/workspace/markdown'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

const STATUS_LABEL: Record<SessionStatus | 'connecting', string> = {
  connecting: 'Connecting',
  creating: 'Provisioning',
  ready: 'Ready',
  working: 'Working',
  submitting: 'Opening PR',
  submitted: 'PR opened',
  error: 'Error',
  stopped: 'Stopped',
}

function statusVariant(
  status: SessionStatus | 'connecting',
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'error') {
    return 'destructive'
  }
  if (status === 'ready' || status === 'submitted') {
    return 'default'
  }
  if (status === 'stopped') {
    return 'outline'
  }
  return 'secondary'
}

function ToolIcon({
  part,
  className,
}: {
  part: ToolCallPart
  className?: string
}) {
  if (part.server) {
    return <DatabaseIcon className={className} />
  }
  switch (part.name) {
    case 'Edit':
    case 'Write':
    case 'MultiEdit':
      return <PencilIcon className={className} />
    case 'Read':
      return <FileTextIcon className={className} />
    case 'Bash':
      return <TerminalIcon className={className} />
    case 'Grep':
    case 'Glob':
      return <SearchIcon className={className} />
    default:
      return <WrenchIcon className={className} />
  }
}

// Only surface in-progress and failed states; a completed call needs no icon
// (a wall of green checks is just noise).
function ToolStatusIcon({
  status,
  className = 'size-4',
}: {
  status: ToolCallPart['status']
  className?: string
}) {
  if (status === 'running') {
    return (
      <Loader2Icon
        className={cn('text-muted-foreground shrink-0 animate-spin', className)}
      />
    )
  }
  if (status === 'error') {
    return (
      <TriangleAlertIcon
        className={cn('text-destructive shrink-0', className)}
      />
    )
  }
  return null
}

// Native Claude Code tool calls (Read, Edit, Bash, …) are noisy, so they render
// as a compact one-line row showing just the action. If there is a detail
// summary, the row expands to reveal it on click.
function NativeToolCall({ part }: { part: ToolCallPart }) {
  const [open, setOpen] = useState(false)
  const expandable = Boolean(part.detail)
  return (
    <div className="text-xs">
      <button
        type="button"
        disabled={!expandable}
        onClick={() => {
          setOpen((v) => !v)
        }}
        className={cn(
          'text-muted-foreground flex w-full items-center gap-1.5 rounded-md py-0.5 text-left',
          expandable && 'hover:text-foreground cursor-pointer',
        )}
      >
        <ToolIcon part={part} className="size-3.5 shrink-0" />
        <span className="font-medium">{part.action}</span>
        {expandable && (
          <ChevronRightIcon
            className={cn(
              'size-3 shrink-0 transition-transform',
              open && 'rotate-90',
            )}
          />
        )}
        <span className="flex-1" />
        <ToolStatusIcon status={part.status} className="size-3.5" />
      </button>
      {open && part.detail && (
        <div className="text-muted-foreground mt-0.5 ml-5 font-mono wrap-break-word">
          {part.detail}
        </div>
      )}
    </div>
  )
}

// A single tool call. MCP calls (which carry a server, e.g. Aiven) get the full
// branded card so the agent's MCP usage is unmissable; native tools fall back
// to the compact row above.
function ToolCall({ part }: { part: ToolCallPart }) {
  if (!part.server) {
    return <NativeToolCall part={part} />
  }
  return (
    <div className="border-brand/30 bg-brand-subtle/40 flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm">
      <span className="bg-brand text-brand-foreground flex size-7 shrink-0 items-center justify-center rounded-lg">
        <ToolIcon part={part} className="size-3.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-brand text-[10px] font-semibold tracking-wider uppercase">
            {part.provider}
          </span>
          <span className="truncate font-medium">{part.action}</span>
        </div>
        {part.detail && (
          <span className="text-muted-foreground truncate font-mono text-xs">
            {part.detail}
          </span>
        )}
      </div>
      <ToolStatusIcon status={part.status} />
    </div>
  )
}

// An assistant turn: ordered text segments interleaved with tool-call cards.
// Falls back to plain content (or a spinner) before any parts have streamed.
function AssistantMessage({ message }: { message: ChatMessage }) {
  if (message.parts && message.parts.length > 0) {
    return (
      <div className="flex flex-col gap-2">
        {message.parts.map((part, index) =>
          part.type === 'tool' ? (
            <ToolCall key={part.id} part={part} />
          ) : part.text.trim() ? (
            <Markdown key={index} small>
              {part.text}
            </Markdown>
          ) : null,
        )}
      </div>
    )
  }
  if (message.content) {
    return <Markdown small>{message.content}</Markdown>
  }
  return <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="bg-muted text-foreground w-fit max-w-[85%] rounded-3xl px-4 py-2.5 text-sm">
        <Markdown small withBreaks>
          {message.content}
        </Markdown>
        <MessageImageAttachments attachments={message.attachments} />
      </div>
    </div>
  )
}

export function Workspace({ id }: { id: string }) {
  const state = useSessionStream(id)
  const [input, setInput] = useState('')
  const [posting, setPosting] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const imageAttachments = useImageAttachments()
  const messageEndRef = useRef<HTMLDivElement>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const updateLayout = () => {
      setIsDesktop(media.matches)
    }

    updateLayout()
    media.addEventListener('change', updateLayout)
    return () => {
      media.removeEventListener('change', updateLayout)
    }
  }, [])

  useEffect(() => {
    if (!showLogs) {
      return
    }
    const frame = window.requestAnimationFrame(() => {
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      logEndRef.current?.scrollIntoView({
        block: 'end',
        behavior: reducedMotion ? 'auto' : 'smooth',
      })
    })
    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [showLogs, state.logs.length])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      messageEndRef.current?.scrollIntoView({
        block: 'end',
        behavior: reducedMotion ? 'auto' : 'smooth',
      })
    })
    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [state.messages, state.error])

  const busy =
    state.status === 'creating' ||
    state.status === 'working' ||
    state.status === 'submitting' ||
    state.status === 'connecting'
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

  const messagePanel = (
    <ScrollArea className="h-full min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
        {state.messages.map((message) =>
          message.role === 'user' ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <div key={message.id} className="group/message w-full min-w-0">
              <AssistantMessage message={message} />
            </div>
          ),
        )}
        {state.error && (
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
            {state.error}
          </div>
        )}
        <div ref={messageEndRef} aria-hidden="true" />
      </div>
    </ScrollArea>
  )

  const activityButton = (
    <button
      type="button"
      onClick={() => {
        setShowLogs((v) => !v)
      }}
      className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 px-4 py-2 text-xs"
    >
      <TerminalIcon className="size-3.5" />
      Activity ({state.logs.length})
    </button>
  )

  const activityLog = (
    <ScrollArea className="min-h-0 flex-1 border-t">
      <div className="space-y-0.5 px-4 py-2 font-mono text-xs">
        {state.logs.map((log, index) => (
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

  return (
    <div className="h-svh">
      <ResizablePanelGroup
        key={mainPanelOrientation}
        orientation={mainPanelOrientation}
        className="h-svh"
      >
        {/* Left: chat + activity */}
        <ResizablePanel
          defaultSize={isDesktop ? '42%' : '50%'}
          minSize={isDesktop ? '22rem' : '30%'}
          maxSize={isDesktop ? '72%' : '75%'}
          className="min-h-0 min-w-0"
        >
          <aside className="flex size-full flex-col border-b md:border-r md:border-b-0">
            <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <IvanLogo className="size-7 rounded-lg" sizes="28px" />
                <span>Ivan</span>
              </Link>
              <div className="flex items-center gap-2">
                {busy && (
                  <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
                )}
                <Badge variant={statusVariant(state.status)}>
                  {STATUS_LABEL[state.status]}
                </Badge>
              </div>
            </header>

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
                  {messagePanel}
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel
                  defaultSize="22%"
                  minSize="8rem"
                  maxSize="55%"
                  className="min-h-0"
                >
                  <div className="flex size-full flex-col">
                    {activityButton}
                    {activityLog}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <>
                {messagePanel}
                <div className="border-t">{activityButton}</div>
              </>
            )}

            <Separator />

            {/* Composer */}
            <div className="p-4">
              <div
                onDragOver={busy ? undefined : imageAttachments.handleDragOver}
                onDragLeave={
                  busy ? undefined : imageAttachments.handleDragLeave
                }
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
                  onChange={(event) => {
                    setInput(event.target.value)
                  }}
                  onPaste={busy ? undefined : imageAttachments.handlePaste}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault()
                      void send()
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
                    {state.prUrl ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                      >
                        <a href={state.prUrl} target="_blank" rel="noreferrer">
                          <GitPullRequestIcon className="size-4" />
                          View PR
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => void submit()}
                        disabled={
                          busy || posting || state.status === 'connecting'
                        }
                      >
                        <GitPullRequestIcon className="size-4" />
                        Open PR
                      </Button>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => void send()}
                    disabled={busy || posting || !input.trim()}
                  >
                    <SendIcon className="size-4" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right: live preview */}
        <ResizablePanel
          defaultSize={isDesktop ? '58%' : '50%'}
          minSize={isDesktop ? '22rem' : '25%'}
          className="min-h-0 min-w-0"
        >
          <main className="relative flex size-full flex-col">
            <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
              <span className="text-sm font-medium">Preview</span>
              {state.previewUrl && (
                <Button asChild variant="ghost" size="sm">
                  <a href={state.previewUrl} target="_blank" rel="noreferrer">
                    Open
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </Button>
              )}
            </header>
            <div className="relative flex-1">
              {state.previewUrl ? (
                <iframe
                  src={state.previewUrl}
                  title="Live preview"
                  className="size-full border-0"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
                  <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
                  <p className="text-muted-foreground text-sm">
                    {STATUS_LABEL[state.status]}… the preview appears once the
                    dev server is up.
                  </p>
                  <Skeleton className="h-40 w-full max-w-lg" />
                </div>
              )}
            </div>
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Toaster />
    </div>
  )
}
