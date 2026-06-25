'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label="Toggle colour theme"
      onClick={() => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
      }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={resolvedTheme === 'dark' ? 'sun' : 'moon'}
          initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
          className="flex size-5 items-center justify-center"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="size-5" />
          ) : (
            <Moon className="size-5" />
          )}
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}
