'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2Icon, SparklesIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/sonner'

export default function Home() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [starting, setStarting] = useState(false)

  async function start() {
    const trimmed = prompt.trim()
    if (!trimmed || starting) {
      return
    }
    setStarting(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      })
      const data = (await res.json()) as { id?: string; error?: string }
      if (!res.ok || !data.id) {
        throw new Error(data.error ?? 'Failed to start session')
      }
      router.push(`/workspace/${data.id}`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to start session',
      )
      setStarting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          Ivan
        </span>
        <h1 className="text-3xl font-bold tracking-tight">
          What do you want to change?
        </h1>
        <p className="text-muted-foreground">
          Describe it. Ivan edits the repo on a fresh branch, you watch it live,
          then ship a PR.
        </p>
      </div>

      <div className="w-full max-w-xl">
        <div className="bg-card focus-within:border-ring/60 flex w-full flex-col gap-2 rounded-2xl border p-2.5 shadow-sm transition-colors">
          <Textarea
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                void start()
              }
            }}
            placeholder="e.g. Make the hero headline bigger and add a discount banner"
            rows={4}
            disabled={starting}
            className="max-h-72 min-h-24 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground hidden px-1 text-xs sm:block">
              ⌘↵ to start
            </span>
            <Button
              onClick={() => void start()}
              disabled={starting || !prompt.trim()}
              className="rounded-full"
            >
              {starting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SparklesIcon className="size-4" />
              )}
              Start building
            </Button>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
