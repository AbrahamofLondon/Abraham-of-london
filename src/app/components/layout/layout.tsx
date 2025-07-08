<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
import './globals.css'
import type { Metadata } from 'next'
import { Inter, Playfair_Display, Montserrat } from 'next/font/google'
import Debug from '@/components/Debug'

// Font optimizations
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Abraham of London | Visionary Entrepreneur & Brand Strategist',
  description: 'World-class consulting, luxury brand development, and transformational leadership.',
  metadataBase: new URL('https://abrahamoflondon.org'),
  keywords: ['luxury brands', 'entrepreneur', 'London', 'brand strategy'],
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://abrahamoflondon.org',
    siteName: 'Abraham of London',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Abraham of London',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@AbrahamOfLondon',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${playfair.variable} ${montserrat.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="min-h-screen bg-luxury-black text-white font-sans antialiased">
        {process.env.NODE_ENV === 'development' && <Debug />}
        {children}
      </body>
    </html>
  )
}