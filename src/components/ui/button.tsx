import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium outline-none transition-[scale,background-color,color,box-shadow,border-color,text-decoration-color] duration-150 ease-out focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        brand: 'bg-brand text-brand-foreground shadow-sm hover:bg-brand/90',
        gradient:
          'bg-gradient-brand-strong text-white shadow-sm hover:shadow-brand/25 hover:shadow-md',
        secondary:
          'border border-border bg-secondary text-secondary-foreground hover:bg-accent',
        outline:
          'border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-brand underline-offset-4 hover:underline',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/30',
      },
      size: {
        sm: "h-10 gap-1.5 px-4 text-sm has-[>svg]:px-3 [&_svg:not([class*='size-'])]:size-3.5",
        default: 'h-10 px-5 text-sm has-[>svg]:px-4',
        lg: 'h-12 px-7 text-base has-[>svg]:px-6',
        xl: "h-14 px-8 text-base has-[>svg]:px-7 [&_svg:not([class*='size-'])]:size-5",
        icon: 'size-10',
        'icon-sm': 'size-10',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  static: staticMotion = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    static?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        buttonVariants({ variant, size }),
        !staticMotion && 'active:scale-[0.96]',
        className,
      )}
      {...props}
    />
  )
}

export { Button, buttonVariants }
