import type { ComponentProps, ElementType } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

/**
 * Typography roles. The variant is the single source of truth for each role's
 * family, weight, and size, so call sites do not set font-* directly.
 */
const text = cva('', {
  variants: {
    variant: {
      display: 'font-display text-display font-semibold text-balance',
      h1: 'font-display text-h1 font-medium text-balance',
      h2: 'font-display text-h2 font-medium text-balance',
      subheading: 'font-sans text-h3 font-medium',
      lead: 'font-sans text-body-lg text-muted-foreground',
      body: 'font-sans text-body',
      caption: 'font-sans text-caption text-muted-foreground',
      eyebrow: 'eyebrow text-brand',
    },
  },
  defaultVariants: { variant: 'body' },
})

type Variant = NonNullable<VariantProps<typeof text>['variant']>

// Default element per role. Override with `as` to keep the document outline
// valid (e.g. a Title that must be an <h2>), or `asChild` to merge onto a child.
const DEFAULT_TAG: Record<Variant, ElementType> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  subheading: 'h3',
  lead: 'p',
  body: 'p',
  caption: 'p',
  eyebrow: 'p',
}

type TextProps = ComponentProps<'p'> &
  VariantProps<typeof text> & {
    as?: ElementType
    asChild?: boolean
  }

export function Text({
  variant = 'body',
  as,
  asChild = false,
  className,
  ...props
}: TextProps) {
  const Comp = asChild ? Slot.Root : (as ?? DEFAULT_TAG[variant ?? 'body'])
  return (
    <Comp
      data-slot="text"
      className={cn(text({ variant }), className)}
      {...props}
    />
  )
}

type RoleProps = Omit<TextProps, 'variant'>

export function Title(props: RoleProps) {
  return <Text variant="display" {...props} />
}
export function Heading(props: RoleProps) {
  return <Text variant="h2" {...props} />
}
export function Subheading(props: RoleProps) {
  return <Text variant="subheading" {...props} />
}
export function Lead(props: RoleProps) {
  return <Text variant="lead" {...props} />
}
export function Body(props: RoleProps) {
  return <Text variant="body" {...props} />
}
export function Caption(props: RoleProps) {
  return <Text variant="caption" {...props} />
}
