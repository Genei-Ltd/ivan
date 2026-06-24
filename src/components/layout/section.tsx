import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const section = cva('w-full', {
  variants: {
    spacing: {
      none: '',
      sm: 'py-12 sm:py-16',
      md: 'py-16 sm:py-24',
      lg: 'py-24 sm:py-32',
    },
  },
  defaultVariants: { spacing: 'md' },
})

export function Section({
  className,
  spacing,
  ...props
}: ComponentProps<'section'> & VariantProps<typeof section>) {
  return (
    <section
      data-slot="section"
      className={cn(section({ spacing }), className)}
      {...props}
    />
  )
}
