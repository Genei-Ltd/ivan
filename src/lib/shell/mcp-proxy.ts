import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Sandbox } from '@vercel/sandbox'
import type { SessionLogger } from './logger'

// The Aiven MCP proxy (scripts/aiven-mcp-proxy.mjs) wraps `npx -y mcp-aiven`.
// It is installed into the sandbox and registered in place of mcp-aiven whenever
// trace mode or demo redirect is on. It logs JSON-RPC to a trace file and, in
// demo mode, rewrites service-by-name calls onto the pre-warmed fork. See the
// script header for details.

export const SANDBOX_MCP_PROXY_PATH = '/vercel/sandbox/ivan-mcp-proxy.mjs'
export const SANDBOX_MCP_TRACE_PATH = '/vercel/sandbox/aiven-mcp-trace.jsonl'

// Copy the proxy script into the sandbox so it can wrap mcp-aiven.
export async function installMcpProxy(
  sandbox: Sandbox,
  logger: SessionLogger,
): Promise<boolean> {
  await logger.info('Installing Aiven MCP proxy…')

  const source = path.join(process.cwd(), 'scripts', 'aiven-mcp-proxy.mjs')

  let content: string
  try {
    content = await readFile(source, 'utf8')
  } catch {
    await logger.error('Could not read Aiven MCP proxy script')
    return false
  }

  try {
    await sandbox.writeFiles([
      { path: SANDBOX_MCP_PROXY_PATH, content: Buffer.from(content, 'utf8') },
    ])
  } catch {
    await logger.error('Failed to write Aiven MCP proxy into sandbox')
    return false
  }

  await logger.success('Aiven MCP proxy installed')
  return true
}
