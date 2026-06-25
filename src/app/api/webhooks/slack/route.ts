import { after } from 'next/server'
import { bot } from '@/lib/slack/bot'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function POST(request: Request) {
  return bot.webhooks.slack(request, {
    waitUntil: (task) => {
      after(() => task)
    },
  })
}
