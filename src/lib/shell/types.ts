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

export type ToolStatus = 'running' | 'done' | 'error'

// A plain-text segment of an assistant turn.
export interface TextPart {
  type: 'text'
  text: string
}

// A single tool invocation in an assistant turn. MCP tools are named
// `mcp__<server>__<tool>` and carry a `server`; everything else is a native
// Claude Code tool (Read, Edit, Bash, …). Rendered as a card in the workspace,
// which is how the agent's MCP usage (the Aiven calls) is made visible.
export interface ToolCallPart {
  type: 'tool'
  id: string // tool_use id, used to match the tool_result that completes it
  name: string // raw tool name, e.g. mcp__aiven__ServiceCreate
  server?: string // MCP server slug for mcp__<server>__ tools
  provider: string // display label, e.g. 'Aiven' or 'Claude'
  action: string // humanised tool action, e.g. 'Service Create'
  detail?: string // short argument summary
  status: ToolStatus
}

export type MessagePart = TextPart | ToolCallPart

export interface ChatImageAttachment {
  id: string
  name: string
  mimeType: string
  size: number
  url: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: ChatImageAttachment[]
  // Ordered parts of an assistant turn (text segments interleaved with tool
  // calls). Absent on user messages and on plain-text assistant replies.
  parts?: MessagePart[]
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
