import { createSlackAdapter } from '@chat-adapter/slack'
import { createMemoryState } from '@chat-adapter/state-memory'
import { Chat, type Message, type Thread } from 'chat'
import { createSession, sendMessage } from '@/lib/shell/manager'
import { getSession } from '@/lib/shell/store'
import type { Session, SessionStatus } from '@/lib/shell/types'

interface SlackThreadState {
  ivanSessionId?: string
}

const BUSY_STATUSES = new Set<SessionStatus>([
  'creating',
  'working',
  'submitting',
])

function workspaceUrl(sessionId: string): string | undefined {
  const baseUrl =
    process.env.IVAN_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)

  if (!baseUrl) {
    return undefined
  }

  return `${baseUrl.replace(/\/$/, '')}/workspace/${sessionId}`
}

function sessionLink(sessionId: string): string {
  const url = workspaceUrl(sessionId)
  return url ? `[Open Ivan workspace](${url})` : `Ivan session: ${sessionId}`
}

function statusMessage(status: SessionStatus): string {
  switch (status) {
    case 'creating':
      return 'Ivan is still provisioning the workspace.'
    case 'working':
      return 'Ivan is still working on the previous message.'
    case 'submitting':
      return 'Ivan is opening the pull request.'
    case 'submitted':
      return 'Ivan has already opened the pull request.'
    case 'ready':
      return 'Ivan is ready.'
    case 'error':
      return 'Ivan hit an error.'
    case 'stopped':
      return 'This Ivan session is stopped.'
  }
}

async function startIvanSession(
  thread: Thread<SlackThreadState>,
  prompt: string,
): Promise<Session> {
  const session = createSession(prompt)
  await thread.setState({ ivanSessionId: session.id }, { replace: true })
  await thread.subscribe()
  return session
}

async function handleIvanInput(
  thread: Thread<SlackThreadState>,
  message: Message,
): Promise<void> {
  const content = message.text.trim()
  if (!content) {
    await thread.post('Send a change request and I will pass it to Ivan.')
    return
  }

  const state = await thread.state
  const existingSession = state?.ivanSessionId
    ? getSession(state.ivanSessionId)
    : undefined

  if (!existingSession) {
    const session = await startIvanSession(thread, content)
    await thread.post({
      markdown: `Started Ivan from this Slack thread. ${sessionLink(session.id)}`,
    })
    return
  }

  if (BUSY_STATUSES.has(existingSession.status)) {
    await thread.post({
      markdown: `${statusMessage(existingSession.status)} ${sessionLink(existingSession.id)}`,
    })
    return
  }

  await thread.post({
    markdown: `Sent to Ivan. ${sessionLink(existingSession.id)}`,
  })

  void sendMessage(existingSession.id, content).catch(
    async (error: unknown) => {
      await thread.post(
        error instanceof Error
          ? error.message
          : 'Failed to send message to Ivan.',
      )
    },
  )
}

export const bot = new Chat({
  userName: 'ivan',
  adapters: {
    slack: createSlackAdapter(),
  },
  state: createMemoryState(),
})

bot.onNewMention(handleIvanInput)
bot.onDirectMessage(handleIvanInput)
bot.onSubscribedMessage(handleIvanInput)
