import '../styles/globals.css'

export const metadata = {
  title: 'Abraham of London | Visionary Entrepreneur & Brand Strategist',
  description: 'World-class consulting, luxury brand development, and transformational leadership.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}