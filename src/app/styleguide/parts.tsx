import type { ReactNode } from 'react'
import { Heading } from '@/components/ui/text'
import { cn } from '@/lib/utils'

/** Top-level styleguide section. */
export function Block({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 border-t border-border py-14 first:border-t-0 first:pt-0"
    >
      <div className="mb-8 flex flex-col gap-2">
        <Heading>{title}</Heading>
        {description ? (
          <p className="max-w-2xl text-body text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-10">{children}</div>
    </section>
  )
}

/** A labelled sub-grouping inside a Block. */
export function Sub({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className={className}>{children}</div>
    </div>
  )
}

/** A colour swatch with name and optional value. */
export function Swatch({
  className,
  name,
  value,
}: {
  className?: string
  name: string
  value?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn('h-16 rounded-xl border border-border/60', className)}
      />
      <div className="text-sm font-medium text-foreground">{name}</div>
      {value ? (
        <div className="font-mono text-xs text-muted-foreground">{value}</div>
      ) : null}
    </div>
  )
}

/** A semantic token swatch showing the surface and its paired foreground. */
export function TokenSwatch({
  surface,
  fg,
  name,
}: {
  surface: string
  fg?: string
  name: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          'flex h-16 items-center justify-center rounded-xl border border-border/60 text-sm font-medium',
          surface,
          fg,
        )}
      >
        Aa
      </div>
      <div className="font-mono text-xs text-muted-foreground">{name}</div>
    </div>
  )
}

/** A single step in a colour ramp. */
export function RampStep({
  className,
  step,
}: {
  className?: string
  step: string
}) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <div
        className={cn(
          'h-12 rounded-md ring-1 ring-inset ring-black/5',
          className,
        )}
      />
      <div className="text-center font-mono text-[10px] text-muted-foreground">
        {step}
      </div>
    </div>
  )
}

/** Wrapper for a row of demo components. */
export function Demo({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {children}
    </div>
  )
}
