import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Uppercase kicker label that sits above a heading. */
export function Eyebrow({
  className,
  children,
  withDot = true,
  ...props
}: ComponentProps<'p'> & { withDot?: boolean }) {
  return (
    <p
      className={cn('eyebrow flex items-center gap-2 text-brand', className)}
      {...props}
    >
      {withDot ? (
        <span aria-hidden className="size-1.5 rounded-full bg-brand" />
      ) : null}
      {children}
    </p>
  )
}
