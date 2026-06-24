import { Montserrat } from 'next/font/google'
import localFont from 'next/font/local'

/**
 * Design-system typefaces.
 *
 * Montserrat (SemiBold/Medium) is used for titles and headers. Google Sans Flex
 * is used for sub-headers, body text, and UI.
 */
export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
  variable: '--font-montserrat',
})

export const googleSansFlex = localFont({
  src: '../../public/fonts/google-sans-flex-latin.woff2',
  weight: '400 700',
  style: 'normal',
  display: 'swap',
  variable: '--font-google-sans-flex',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
})

export const fontVariables = `${montserrat.variable} ${googleSansFlex.variable}`
