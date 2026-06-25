'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2Icon, SparklesIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { useImageAttachments } from '@/hooks/use-image-attachments'
import { IvanLogo } from '@/components/layout/ivan-logo'
import {
  ImageAttachmentPicker,
  PendingImageAttachments,
} from '@/components/workspace/image-attachments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

export default function Home() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [starting, setStarting] = useState(false)
  const imageAttachments = useImageAttachments()

  async function start() {
    const trimmed = prompt.trim()
    if (!trimmed || starting) {
      return
    }
    setStarting(true)
    try {
      const formData = new FormData()
      formData.append('prompt', trimmed)
      for (const attachment of imageAttachments.attachments) {
        formData.append('images', attachment.file, attachment.file.name)
      }

      const res = await fetch('/api/sessions', {
        method: 'POST',
        body: formData,
      })
      const data = (await res.json()) as { id?: string; error?: string }
      if (!res.ok || !data.id) {
        throw new Error(data.error ?? 'Failed to start session')
      }
      imageAttachments.clearAttachments()
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
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center">
          <IvanLogo
            alt="Ivan"
            priority
            sizes="64px"
            className="size-16 rounded-xl shadow-sm"
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Change production. Break nothing.
        </h1>
        <p className="text-muted-foreground max-w-2xl text-balance">
          Describe a change in plain English. Ivan makes it on a full-data fork
          of production, proves it works, then opens a PR. No customer is ever
          at risk.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <div
          onDragOver={starting ? undefined : imageAttachments.handleDragOver}
          onDragLeave={starting ? undefined : imageAttachments.handleDragLeave}
          onDrop={starting ? undefined : imageAttachments.handleDrop}
          className={cn(
            'shadow-border hover:shadow-border-hover focus-within:shadow-border-focus mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-2xl bg-card p-2.5 transition-[background-color,box-shadow] duration-150 ease-out',
            imageAttachments.dragging && 'shadow-border-focus bg-accent/20',
          )}
        >
          <PendingImageAttachments
            attachments={imageAttachments.attachments}
            disabled={starting}
            onRemove={imageAttachments.removeAttachment}
          />
          <Textarea
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value)
            }}
            onPaste={starting ? undefined : imageAttachments.handlePaste}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault()
                void start()
              }
            }}
            placeholder="e.g. Checkout is slow, find out why and fix it"
            rows={2}
            disabled={starting}
            className="max-h-48 min-h-12 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="flex items-center justify-between gap-2">
            <ImageAttachmentPicker
              disabled={starting}
              onFiles={imageAttachments.addFiles}
            />
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => void start()}
              disabled={starting || !prompt.trim()}
            >
              <span className="relative size-4">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={starting ? 'loading' : 'sparkles'}
                    initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                    transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {starting ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <SparklesIcon className="size-4" />
                    )}
                  </motion.span>
                </AnimatePresence>
              </span>
              Start building
            </Button>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
