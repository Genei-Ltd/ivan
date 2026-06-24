import type { LogEntry, LogType } from './types'

// Redact secrets from log messages before they reach the browser. Covers the
// tokens this shell actually handles.
export function redactSensitiveInfo(message: string): string {
  let redacted = message

  const patterns = [
    /ANTHROPIC_API_KEY[=\s]*["']?(sk-ant-[a-zA-Z0-9_-]{20,})/gi,
    /GITHUB_TOKEN[=\s]*["']?([gh][phosr]_[a-zA-Z0-9_]{20,})/gi,
    /https:\/\/(gh[phosr]_[a-zA-Z0-9_]{20,})(?::x-oauth-basic)?@github\.com/gi,
    /https:\/\/x-access-token:([a-zA-Z0-9_-]{20,})@github\.com/gi,
    /Bearer\s+([a-zA-Z0-9_-]{20,})/gi,
    /SANDBOX_VERCEL_TOKEN[=\s:]*["']?([a-zA-Z0-9_-]{20,})/gi,
  ]

  for (const pattern of patterns) {
    redacted = redacted.replace(pattern, (match, key: string) => {
      const masked =
        key.length > 8
          ? `${key.slice(0, 4)}${'*'.repeat(Math.max(8, key.length - 8))}${key.slice(-4)}`
          : '*'.repeat(key.length)
      return match.replace(key, masked)
    })
  }

  // Generic VAR=secret assignments.
  redacted = redacted.replace(
    /([A-Z_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Z_]*)[=\s:]*["']?([a-zA-Z0-9_-]{8,})["']?/gi,
    (_match, varName: string, value: string) => {
      const masked =
        value.length > 8
          ? `${value.slice(0, 4)}${'*'.repeat(Math.max(8, value.length - 8))}${value.slice(-4)}`
          : '*'.repeat(value.length)
      return `${varName}="${masked}"`
    },
  )

  return redacted
}

export function createLogEntry(type: LogType, message: string): LogEntry {
  return {
    type,
    message: redactSensitiveInfo(message),
    timestamp: new Date().toISOString(),
  }
}
