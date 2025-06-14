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
      <head>
        <link rel="canonical" href="https://tangerine-pony-06022c.netlify.app/" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta property="og:title" content="Abraham of London" />
        <meta property="og:description" content="World-class consulting, luxury brand development, and transformational leadership." />
        <meta property="og:url" content="https://tangerine-pony-06022c.netlify.app/" />
        <meta name="twitter:card" content="summary" />
      </head>
      <body>{children}</body>
    </html>
  )
}