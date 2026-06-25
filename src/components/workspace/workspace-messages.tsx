'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ChevronRightIcon,
  DatabaseIcon,
  FileTextIcon,
  Loader2Icon,
  PencilIcon,
  SearchIcon,
  TerminalIcon,
  TriangleAlertIcon,
  WrenchIcon,
} from 'lucide-react'
import type { ChatMessage, ToolCallPart } from '@/lib/shell/types'
import { cn } from '@/lib/utils'
import { normalizeKnownSlackMentions } from '@/lib/slack/mentions'
import { MessageImageAttachments } from '@/components/workspace/image-attachments'
import { Markdown } from '@/components/workspace/markdown'
import { ScrollArea } from '@/components/ui/scroll-area'

const BOTTOM_STICKINESS_THRESHOLD = 48

function isNearBottom(element: HTMLElement) {
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight <=
    BOTTOM_STICKINESS_THRESHOLD
  )
}

function scrollToBottom(element: HTMLElement) {
  element.scrollTop = element.scrollHeight
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

// Native Claude Code tool calls (Read, Edit, Bash, ...) are noisy, so they
// render as a compact one-line row. If there is detail, the row expands.
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

// MCP tool calls carry a server label and get the branded card treatment;
// native tools stay compact.
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
  const hasImageAttachments = Boolean(message.attachments?.length)
  const content = normalizeKnownSlackMentions(message.content)

  return (
    <div className="flex justify-end">
      <div
        className={cn(
          'bg-muted text-foreground w-fit max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
          hasImageAttachments && 'pb-4',
        )}
      >
        <Markdown small withBreaks>
          {content}
        </Markdown>
        <MessageImageAttachments attachments={message.attachments} />
      </div>
    </div>
  )
}

export function WorkspaceMessages({
  error,
  messages,
}: {
  error?: string
  messages: ChatMessage[]
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const shouldStickToBottomRef = useRef(true)

  function handleScroll() {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }
    shouldStickToBottomRef.current = isNearBottom(viewport)
  }

  useEffect(() => {
    if (!shouldStickToBottomRef.current) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      const viewport = viewportRef.current
      if (viewport && shouldStickToBottomRef.current) {
        scrollToBottom(viewport)
      }
    })
    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [error, messages])

  return (
    <div className="h-full min-h-0 flex-1">
      <ScrollArea
        className="size-full [&_[data-slot=scroll-area-viewport]>div]:block!"
        viewportRef={viewportRef}
        viewportProps={{ onScroll: handleScroll }}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
          {messages.map((message) =>
            message.role === 'user' ? (
              <UserMessage key={message.id} message={message} />
            ) : (
              <div key={message.id} className="group/message w-full min-w-0">
                <AssistantMessage message={message} />
              </div>
            ),
          )}
          {error && (
            <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <div aria-hidden="true" />
        </div>
      </ScrollArea>
    </div>
  )
}
