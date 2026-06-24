'use client'

import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'

/**
 * Respects the user's motion preference across all motion components: when
 * reduced motion is requested, transforms are dropped and only opacity changes
 * remain.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
