'use client'

import type { ComponentProps, ReactNode } from 'react'
import { motion } from 'motion/react'

type RevealProps = Omit<ComponentProps<typeof motion.div>, 'children'> & {
  delay?: number
  children?: ReactNode
}

/**
 * Fade-and-rise on scroll into view. Reduced motion is handled globally by the
 * MotionConfig in providers (reducedMotion="user"), which drops transform
 * changes and keeps a plain fade.
 */
export function Reveal({ delay = 0, children, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ type: 'spring', duration: 0.45, delay, bounce: 0 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
