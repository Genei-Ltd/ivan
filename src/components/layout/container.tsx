import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const container = cva('mx-auto w-full px-5 sm:px-6 lg:px-8', {
  variants: {
    size: {
      sm: 'max-w-3xl',
      md: 'max-w-5xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-none',
    },
  },
  defaultVariants: { size: 'xl' },
})

export function Container({
  className,
  size,
  asChild = false,
  ...props
}: ComponentProps<'div'> &
  VariantProps<typeof container> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'div'
  return <Comp className={cn(container({ size }), className)} {...props} />
}
