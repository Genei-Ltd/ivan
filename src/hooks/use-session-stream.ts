'use client'

import { useEffect, useReducer } from 'react'
import type {
  ChatMessage,
  LogEntry,
  Session,
  SessionStatus,
  ShellEvent,
} from '@/lib/shell/types'

export interface StreamState {
  status: SessionStatus | 'connecting'
  messages: ChatMessage[]
  logs: LogEntry[]
  previewUrl?: string
  previewVersion: number
  prUrl?: string
  error?: string
  notFound: boolean
}

const initialState: StreamState = {
  status: 'connecting',
  messages: [],
  logs: [],
  previewVersion: 0,
  notFound: false,
}

function reduce(state: StreamState, event: ShellEvent): StreamState {
  switch (event.kind) {
    case 'status':
      return {
        ...state,
        status: event.status,
        error: event.status === 'error' ? state.error : undefined,
      }
    case 'log':
      return { ...state, logs: [...state.logs, event.entry] }
    case 'message': {
      const index = state.messages.findIndex((m) => m.id === event.message.id)
      const messages =
        index >= 0
          ? state.messages.map((m) =>
              m.id === event.message.id ? mergeMessage(m, event.message) : m,
            )
          : [...state.messages, event.message]
      return { ...state, messages }
    }
    case 'preview':
      return {
        ...state,
        previewUrl: event.url,
        previewVersion: state.previewVersion + 1,
      }
    case 'pr':
      return { ...state, prUrl: event.url }
    case 'error':
      return { ...state, error: event.message }
    case 'changes':
      return state
  }
}

function mergeMessage(existing: ChatMessage | undefined, next: ChatMessage) {
  if (!existing) {
    return next
  }
  if (existing.role === 'assistant' && next.role === 'assistant') {
    return mergeAssistantMessage(existing, next)
  }
  return next
}

function assistantMessageScore(message: ChatMessage): number {
  const parts = message.parts ?? []
  const terminalTools = parts.filter(
    (part) => part.type === 'tool' && part.status !== 'running',
  ).length
  const textLength =
    message.content.length +
    parts
      .filter((part) => part.type === 'text')
      .reduce((length, part) => length + part.text.length, 0)

  // Parts carry tool/MCP cards. Weight them above raw text length so a snapshot
  // with structured cards is never discarded in favor of older plain text.
  const partsWeight = parts.length * 100_000
  const terminalToolWeight = terminalTools * 1_000
  const runningToolPenalty =
    parts.filter((part) => part.type === 'tool' && part.status === 'running')
      .length * 10

  return partsWeight + terminalToolWeight + textLength - runningToolPenalty
}

function mergeAssistantMessage(
  existing: ChatMessage,
  next: ChatMessage,
): ChatMessage {
  if (assistantMessageScore(existing) > assistantMessageScore(next)) {
    return existing
  }
  return next
}

function reduceSnapshot(state: StreamState, session: Session): StreamState {
  const messagesById = new Map(
    state.messages.map((message) => [message.id, message]),
  )
  for (const message of session.messages) {
    messagesById.set(
      message.id,
      mergeMessage(messagesById.get(message.id), message),
    )
  }

  const previewUrl = session.previewUrl
  return {
    ...state,
    status: session.status,
    messages: [...messagesById.values()],
    logs:
      session.logs.length > state.logs.length
        ? [...state.logs, ...session.logs.slice(state.logs.length)]
        : state.logs,
    previewUrl,
    previewVersion:
      previewUrl && previewUrl !== state.previewUrl
        ? state.previewVersion + 1
        : state.previewVersion,
    prUrl: session.prUrl,
    error: session.error,
    notFound: false,
  }
}

type Action =
  | { type: 'event'; event: ShellEvent }
  | { type: 'snapshot'; session: Session }
  | { type: 'notfound' }

function reducer(state: StreamState, action: Action): StreamState {
  if (action.type === 'notfound') {
    return { ...state, notFound: true }
  }
  if (action.type === 'snapshot') {
    return reduceSnapshot(state, action.session)
  }
  return reduce(state, action.event)
}

// Subscribe to a session's server-sent events and accumulate them into state.
export function useSessionStream(id: string): StreamState {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const source = new EventSource(`/api/sessions/${id}/events`)

    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data as string) as ShellEvent
        dispatch({ type: 'event', event })
      } catch {
        // ignore malformed frames (e.g. heartbeats)
      }
    }
    source.addEventListener('notfound', () => {
      dispatch({ type: 'notfound' })
      source.close()
    })

    return () => {
      source.close()
    }
  }, [id])

  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      try {
        const res = await fetch(`/api/sessions/${id}`)
        if (cancelled) {
          return
        }
        if (res.status === 404) {
          dispatch({ type: 'notfound' })
          return
        }
        if (!res.ok) {
          return
        }
        const data = (await res.json()) as { session?: Session }
        if (data.session) {
          dispatch({ type: 'snapshot', session: data.session })
        }
      } catch {
        // EventSource remains the primary live transport; polling is fallback.
      }
    }

    const interval = setInterval(() => {
      void refresh()
    }, 3000)
    void refresh()

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [id])

  return state
}
