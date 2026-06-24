import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// The design system adds named font-size utilities (text-display, text-h1,
// text-caption, …). tailwind-merge doesn't know these are sizes, so it treats
// e.g. `text-caption` as conflicting with `text-muted-foreground` (a colour) and
// drops the size. Register them so size and colour survive together.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // Named font sizes, else tailwind-merge reads e.g. `text-caption` as a
      // colour and drops it next to `text-muted-foreground`.
      'font-size': [
        {
          text: [
            'display',
            'h1',
            'h2',
            'h3',
            'body',
            'body-lg',
            'caption',
            'eyebrow',
          ],
        },
      ],
      // Brand gradient fills are background-images, not colours; without this
      // they'd be dropped next to a `bg-*` colour on the same element.
      'bg-image': [
        { bg: ['gradient-brand', 'gradient-brand-strong', 'gradient-mesh'] },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
