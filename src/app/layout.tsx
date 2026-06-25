import type { Metadata } from 'next'
import { fontVariables } from '@/lib/fonts'
import { AppProviders } from '@/providers/app-providers'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Ivan',
    default: 'Ivan',
  },
  description: 'Ship changes to your app by talking to Ivan.',
  icons: {
    icon: '/brand/ivan-logo.png',
    apple: '/brand/ivan-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontVariables} antialiased`}
    >
      <body className="typography-dense min-h-svh antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
