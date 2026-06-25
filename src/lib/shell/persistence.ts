import type pg from 'pg'
import { createPostgresPool, postgresConnectionString } from '@/lib/postgres'
import type { ChatMessage, LogEntry, Session, SessionStatus } from './types'
import type { UploadedImageAttachment } from './attachments'

interface SessionRow {
  id: string
  status: SessionStatus
  repo_url: string
  base_branch: string
  branch: string
  sandbox_name: string | null
  preview_url: string | null
  pr_url: string | null
  error: string | null
  claude_session_id: string | null
  slack_thread_id: string | null
  messages: unknown
  logs: unknown
  created_at: Date | string
  updated_at: Date | string
}

interface AttachmentRow {
  id: string
  name: string
  mime_type: string
  size: number
  data: Buffer
}

export interface PersistedSession {
  session: Session
  claudeSessionId?: string
}

const SESSION_COLUMNS = `
  id,
  status,
  repo_url,
  base_branch,
  branch,
  sandbox_name,
  preview_url,
  pr_url,
  error,
  claude_session_id,
  slack_thread_id,
  messages,
  logs,
  created_at,
  updated_at
`

const globalForPersistence = globalThis as unknown as {
  __ivanPgPool?: pg.Pool
  __ivanPgSchemaReady?: Promise<void>
}

function connectionString(): string | undefined {
  return postgresConnectionString()
}

export function hasSessionPersistence(): boolean {
  return Boolean(connectionString())
}

function getPool(): pg.Pool {
  const url = connectionString()
  if (!url) {
    throw new Error('DATABASE_URL or POSTGRES_URL is required')
  }

  globalForPersistence.__ivanPgPool ??= createPostgresPool({ max: 5 })

  return globalForPersistence.__ivanPgPool
}

async function ensureSchema(): Promise<void> {
  if (!hasSessionPersistence()) {
    return
  }

  globalForPersistence.__ivanPgSchemaReady ??= (async () => {
    const pool = getPool()
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ivan_sessions (
        id text PRIMARY KEY,
        status text NOT NULL,
        repo_url text NOT NULL,
        base_branch text NOT NULL,
        branch text NOT NULL,
        sandbox_name text,
        preview_url text,
        pr_url text,
        error text,
        claude_session_id text,
        slack_thread_id text,
        messages jsonb NOT NULL DEFAULT '[]'::jsonb,
        logs jsonb NOT NULL DEFAULT '[]'::jsonb,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ivan_session_attachments (
        session_id text NOT NULL REFERENCES ivan_sessions(id) ON DELETE CASCADE,
        id text NOT NULL,
        name text NOT NULL,
        mime_type text NOT NULL,
        size integer NOT NULL,
        data bytea NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (session_id, id)
      )
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS ivan_sessions_created_at_idx
      ON ivan_sessions (created_at DESC)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS ivan_sessions_slack_thread_id_idx
      ON ivan_sessions (slack_thread_id)
      WHERE slack_thread_id IS NOT NULL
    `)
  })()

  await globalForPersistence.__ivanPgSchemaReady
}

function dateToIso(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString()
}

function jsonArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function rowToSession(row: SessionRow): PersistedSession {
  const session: Session = {
    id: row.id,
    status: row.status,
    repoUrl: row.repo_url,
    baseBranch: row.base_branch,
    branch: row.branch,
    sandboxName: row.sandbox_name ?? undefined,
    previewUrl: row.preview_url ?? undefined,
    prUrl: row.pr_url ?? undefined,
    error: row.error ?? undefined,
    slackThreadId: row.slack_thread_id ?? undefined,
    messages: jsonArray<ChatMessage>(row.messages),
    logs: jsonArray<LogEntry>(row.logs),
    createdAt: dateToIso(row.created_at),
    updatedAt: dateToIso(row.updated_at),
  }
  return {
    session,
    claudeSessionId: row.claude_session_id ?? undefined,
  }
}

export async function saveSessionSnapshot(
  session: Session,
  claudeSessionId?: string,
): Promise<void> {
  if (!hasSessionPersistence()) {
    return
  }

  await ensureSchema()
  await getPool().query(
    `
      INSERT INTO ivan_sessions (
        id,
        status,
        repo_url,
        base_branch,
        branch,
        sandbox_name,
        preview_url,
        pr_url,
        error,
        claude_session_id,
        slack_thread_id,
        messages,
        logs,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12::jsonb, $13::jsonb, $14, now()
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        repo_url = EXCLUDED.repo_url,
        base_branch = EXCLUDED.base_branch,
        branch = EXCLUDED.branch,
        sandbox_name = EXCLUDED.sandbox_name,
        preview_url = EXCLUDED.preview_url,
        pr_url = EXCLUDED.pr_url,
        error = EXCLUDED.error,
        claude_session_id = COALESCE(
          EXCLUDED.claude_session_id,
          ivan_sessions.claude_session_id
        ),
        slack_thread_id = EXCLUDED.slack_thread_id,
        messages = EXCLUDED.messages,
        logs = EXCLUDED.logs,
        updated_at = now()
    `,
    [
      session.id,
      session.status,
      session.repoUrl,
      session.baseBranch,
      session.branch,
      session.sandboxName ?? null,
      session.previewUrl ?? null,
      session.prUrl ?? null,
      session.error ?? null,
      claudeSessionId ?? null,
      session.slackThreadId ?? null,
      JSON.stringify(session.messages),
      JSON.stringify(session.logs),
      session.createdAt,
    ],
  )
}

export async function saveClaudeSessionId(
  sessionId: string,
  claudeSessionId: string,
): Promise<void> {
  if (!hasSessionPersistence()) {
    return
  }

  await ensureSchema()
  await getPool().query(
    `
      UPDATE ivan_sessions
      SET claude_session_id = $2, updated_at = now()
      WHERE id = $1
    `,
    [sessionId, claudeSessionId],
  )
}

export async function loadSession(
  id: string,
): Promise<PersistedSession | undefined> {
  if (!hasSessionPersistence()) {
    return undefined
  }

  await ensureSchema()
  const result = await getPool().query<SessionRow>(
    `
      SELECT ${SESSION_COLUMNS}
      FROM ivan_sessions
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  )
  if (result.rowCount === 0) {
    return undefined
  }
  return rowToSession(result.rows[0])
}

export async function listPersistedSessions(): Promise<Session[]> {
  if (!hasSessionPersistence()) {
    return []
  }

  await ensureSchema()
  const result = await getPool().query<SessionRow>(
    `
      SELECT ${SESSION_COLUMNS}
      FROM ivan_sessions
      ORDER BY created_at DESC
      LIMIT 100
    `,
  )
  return result.rows.map((row) => rowToSession(row).session)
}

export async function saveImageAttachments(
  sessionId: string,
  attachments: UploadedImageAttachment[],
): Promise<void> {
  if (!hasSessionPersistence() || attachments.length === 0) {
    return
  }

  await ensureSchema()
  for (const attachment of attachments) {
    await getPool().query(
      `
        INSERT INTO ivan_session_attachments (
          session_id,
          id,
          name,
          mime_type,
          size,
          data
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (session_id, id) DO UPDATE SET
          name = EXCLUDED.name,
          mime_type = EXCLUDED.mime_type,
          size = EXCLUDED.size,
          data = EXCLUDED.data
      `,
      [
        sessionId,
        attachment.id,
        attachment.name,
        attachment.mimeType,
        attachment.size,
        Buffer.from(attachment.data),
      ],
    )
  }
}

export async function loadImageAttachment(
  sessionId: string,
  attachmentId: string,
): Promise<UploadedImageAttachment | undefined> {
  if (!hasSessionPersistence()) {
    return undefined
  }

  await ensureSchema()
  const result = await getPool().query<AttachmentRow>(
    `
      SELECT id, name, mime_type, size, data
      FROM ivan_session_attachments
      WHERE session_id = $1 AND id = $2
      LIMIT 1
    `,
    [sessionId, attachmentId],
  )
  if (result.rowCount === 0) {
    return undefined
  }
  const row = result.rows[0]

  return {
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    size: row.size,
    data: new Uint8Array(row.data),
  }
}
