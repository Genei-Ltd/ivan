import { after } from 'next/server'
import { getBot } from '@/lib/slack/bot'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function POST(request: Request) {
  return getBot().webhooks.slack(request, {
    waitUntil: (task) => {
      after(() => task)
    },
  })
}
