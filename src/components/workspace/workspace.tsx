'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ExternalLinkIcon,
  GitPullRequestIcon,
  Loader2Icon,
  SendIcon,
  TerminalIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSessionStream } from '@/hooks/use-session-stream'
import type { SessionStatus } from '@/lib/shell/types'
import { cn } from '@/lib/utils'
import { Markdown } from '@/components/workspace/markdown'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'

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

export function Workspace({ id }: { id: string }) {
  const state = useSessionStream(id)
  const [input, setInput] = useState('')
  const [posting, setPosting] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const busy =
    state.status === 'creating' ||
    state.status === 'working' ||
    state.status === 'submitting' ||
    state.status === 'connecting'

  async function send() {
    const content = input.trim()
    if (!content || busy || posting) {
      return
    }
    setPosting(true)
    setInput('')
    try {
      const res = await fetch(`/api/sessions/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to send')
      }
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

  return (
    <div className="flex h-svh flex-col md:flex-row">
      {/* Left: chat + activity */}
      <aside className="flex h-1/2 w-full flex-col border-b md:h-full md:w-105 md:border-r md:border-b-0">
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
          <Link href="/" className="text-sm font-semibold">
            Ivan
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

        <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
            {state.messages.map((message) =>
              message.role === 'user' ? (
                <div key={message.id} className="flex justify-end">
                  <div className="bg-muted text-foreground w-fit max-w-[85%] rounded-3xl px-4 py-2.5 text-sm">
                    <Markdown small withBreaks>
                      {message.content}
                    </Markdown>
                  </div>
                </div>
              ) : (
                <div key={message.id} className="group/message w-full min-w-0">
                  {message.content ? (
                    <Markdown small>{message.content}</Markdown>
                  ) : (
                    <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
                  )}
                </div>
              ),
            )}
            {state.error && (
              <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                {state.error}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Activity log */}
        <div className="border-t">
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
          {showLogs && (
            <ScrollArea className="h-40 border-t">
              <div className="space-y-0.5 px-4 py-2 font-mono text-xs">
                {state.logs.map((log, index) => (
                  <div
                    key={index}
                    className={cn(
                      'wrap-break-word whitespace-pre-wrap',
                      log.type === 'error' && 'text-destructive',
                      log.type === 'command' && 'text-foreground',
                      log.type === 'success' &&
                        'text-green-600 dark:text-green-400',
                      log.type === 'info' && 'text-muted-foreground',
                    )}
                  >
                    {log.message}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <Separator />

        {/* Composer */}
        <div className="p-4">
          <div className="bg-card focus-within:border-ring/60 mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-2xl border p-2.5 transition-colors">
            <Textarea
              value={input}
              onChange={(event) => {
                setInput(event.target.value)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
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
                  disabled={busy || posting || state.status === 'connecting'}
                >
                  <GitPullRequestIcon className="size-4" />
                  Open PR
                </Button>
              )}
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

      {/* Right: live preview */}
      <main className="relative flex h-1/2 flex-1 flex-col md:h-full">
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
                {STATUS_LABEL[state.status]}… the preview appears once the dev
                server is up.
              </p>
              <Skeleton className="h-40 w-full max-w-lg" />
            </div>
          )}
        </div>
      </main>

      <Toaster />
    </div>
  )
}
