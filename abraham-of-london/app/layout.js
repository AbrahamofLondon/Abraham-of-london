import '../styles/globals.css'  // fallback
import { geistSans, geistMono } from '@/lib/fonts'

export const metadata = {
  title: 'My Site',
  description: 'Built with Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
