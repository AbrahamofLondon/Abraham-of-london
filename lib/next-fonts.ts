// lib/next-fonts.ts
import { Inter, Roboto_Mono } from 'next/font/google'
import localFont from 'next/font/local'

// Configure Inter font with all weights
export const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  fallback: ['system-ui', 'sans-serif'],
  preload: true,
  adjustFontFallback: true,
})

// Configure mono font for code
export const robotoMono = Roboto_Mono({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  fallback: ['monospace'],
})

// Optional: Local font for premium feel
export const editorialFont = localFont({
  src: [
    {
      path: '../public/fonts/EditorialNew-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/EditorialNew-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/fonts/EditorialNew-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/EditorialNew-BoldItalic.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-editorial',
  display: 'swap',
})

// Combine all font variables
export const fontVariables = `${inter.variable} ${robotoMono.variable} ${editorialFont.variable}`

// Font class names for body
export const fontBodyClass = inter.className

// Font utility types
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
export type FontStyle = 'normal' | 'italic'

// Font configuration export
export const fontConfig = {
  inter,
  robotoMono,
  editorialFont,
  fontVariables,
  fontBodyClass,
}