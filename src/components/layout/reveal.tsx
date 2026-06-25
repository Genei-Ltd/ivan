'use client'

import type { ComponentProps, ReactNode } from 'react'
import { motion } from 'motion/react'

type RevealProps = Omit<ComponentProps<typeof motion.div>, 'children'> & {
  delay?: number
  children?: ReactNode
}

/**
 * Fade-and-rise on scroll into view. Reduced motion is handled globally by the
 * MotionConfig in providers (reducedMotion="user"), which drops the transform
 * and keeps a plain fade.
 */
export function Reveal({ delay = 0, children, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
