'use client'

import { useEffect, useReducer } from 'react'
import type {
  ChatMessage,
  LogEntry,
  SessionStatus,
  ShellEvent,
} from '@/lib/shell/types'

export interface StreamState {
  status: SessionStatus | 'connecting'
  messages: ChatMessage[]
  logs: LogEntry[]
  previewUrl?: string
  prUrl?: string
  error?: string
  notFound: boolean
}

const initialState: StreamState = {
  status: 'connecting',
  messages: [],
  logs: [],
  notFound: false,
}

function reduce(state: StreamState, event: ShellEvent): StreamState {
  switch (event.kind) {
    case 'status':
      return { ...state, status: event.status }
    case 'log':
      return { ...state, logs: [...state.logs, event.entry] }
    case 'message': {
      const index = state.messages.findIndex((m) => m.id === event.message.id)
      const messages =
        index >= 0
          ? state.messages.map((m) =>
              m.id === event.message.id ? event.message : m,
            )
          : [...state.messages, event.message]
      return { ...state, messages }
    }
    case 'preview':
      return { ...state, previewUrl: event.url }
    case 'pr':
      return { ...state, prUrl: event.url }
    case 'error':
      return { ...state, error: event.message }
    case 'changes':
      return state
  }
}

type Action = { type: 'event'; event: ShellEvent } | { type: 'notfound' }

function reducer(state: StreamState, action: Action): StreamState {
  if (action.type === 'notfound') {
    return { ...state, notFound: true }
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

  return state
}
