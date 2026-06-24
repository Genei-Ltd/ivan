'use client'

import { toast } from 'sonner'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'

export function ToastDemo() {
  return (
    <>
      <Toaster />
      <Button
        variant="outline"
        onClick={() =>
          toast('Analysis complete', {
            description: '3 themes surfaced across 24 transcripts.',
            action: { label: 'View', onClick: () => undefined },
          })
        }
      >
        <Bell />
        Show toast
      </Button>
    </>
  )
}
