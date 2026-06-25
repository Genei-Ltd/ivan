import { Agentation } from 'agentation'

import type { Metadata } from 'next'
import { fontVariables } from '@/lib/fonts'
import { ThemeProvider } from '@/providers/theme-provider'
import { MotionProvider } from '@/providers/motion-provider'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Ivan',
    default: 'Ivan',
  },
  description: 'Ship changes to your app by talking to Ivan.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <html lang="en" suppressHydrationWarning className={fontVariables}>
        <body className="typography-dense min-h-svh antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <MotionProvider>{children}</MotionProvider>
          </ThemeProvider>
        </body>
      </html>
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </>
  )
}
