// Core types for Ivan. Sessions are held in memory and authenticated with env
// tokens (no database, no per-user auth).

export type LogType = 'info' | 'command' | 'error' | 'success'

export interface LogEntry {
  type: LogType
  message: string
  timestamp: string
}

export type SessionStatus =
  | 'creating' // sandbox spinning up, repo cloning, deps installing
  | 'ready' // dev server up, agent idle, awaiting input
  | 'working' // agent running a turn
  | 'submitting' // committing, pushing, opening PR
  | 'submitted' // PR opened
  | 'error'
  | 'stopped'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// Streamed to the browser over SSE. The client upserts chat messages by id and
// appends logs to the activity pane.
export type ShellEvent =
  | { kind: 'status'; status: SessionStatus; message?: string }
  | { kind: 'log'; entry: LogEntry }
  | { kind: 'message'; message: ChatMessage } // upsert by id
  | { kind: 'preview'; url: string }
  | { kind: 'pr'; url: string }
  | { kind: 'changes'; changed: boolean }
  | { kind: 'error'; message: string }

export interface Session {
  id: string
  status: SessionStatus
  repoUrl: string
  baseBranch: string
  branch: string
  previewUrl?: string
  prUrl?: string
  error?: string
  messages: ChatMessage[]
  logs: LogEntry[]
  createdAt: string
}

// Result shapes returned by the sandbox engine.
export interface SandboxResult {
  success: boolean
  domain?: string
  branchName?: string
  error?: string
}

export interface AgentExecutionResult {
  success: boolean
  changesDetected: boolean
  sessionId?: string // Claude chat session id, for --resume
  error?: string
}
