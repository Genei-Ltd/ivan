import Image from 'next/image'

import { cn } from '@/lib/utils'

interface IvanLogoProps {
  alt?: string
  className?: string
  priority?: boolean
  sizes?: string
}

export function IvanLogo({
  alt = '',
  className,
  priority = false,
  sizes = '40px',
}: IvanLogoProps) {
  return (
    <Image
      src="/brand/ivan-logo.png"
      alt={alt}
      width={999}
      height={999}
      priority={priority}
      sizes={sizes}
      className={cn('size-10 shrink-0 rounded-xl object-contain', className)}
    />
  )
}
