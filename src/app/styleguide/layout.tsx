import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Styleguide',
  description: 'Design system tokens and components.',
}

export default function StyleguideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <Container>
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="Home"
            >
              <span className="font-display text-sm font-semibold text-foreground">
                Next Vibe Template
              </span>
              <Badge variant="brand-subtle">Design System</Badge>
            </Link>
            <ThemeToggle />
          </div>
        </Container>
      </header>
      <Container>
        <div className="py-16">{children}</div>
      </Container>
    </div>
  )
}
