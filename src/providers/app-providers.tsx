'use client'

import type { ReactNode } from 'react'
import { MotionProvider } from '@/providers/motion-provider'
import { ThemeProvider } from '@/providers/theme-provider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <MotionProvider>{children}</MotionProvider>
    </ThemeProvider>
  )
}
