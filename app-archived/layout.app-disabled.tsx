// app/layout.tsx
import "../styles/globals.scss";
import type { Metadata } from "next";
import { fontConfig } from "@/lib/next-fonts";
import { Inter } from 'next/font/google'

// Preload Inter font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: "Abraham of London | Luxury Editorial",
    template: "%s | Abraham of London",
  },
  description: "Official luxury editorial site for Abraham of London. Premium content, strategies, and insights.",
  keywords: ["luxury", "editorial", "premium", "London", "strategy", "investment"],
  authors: [{ name: "Abraham of London" }],
  creator: "Abraham of London",
  publisher: "Abraham of London",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.SITE_URL || 'https://abrahamoflondon.com'),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: '/',
    title: 'Abraham of London | Luxury Editorial',
    description: 'Official luxury editorial site for Abraham of London',
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
    title: 'Abraham of London | Luxury Editorial',
    description: 'Official luxury editorial site for Abraham of London',
    images: ['/twitter-image.jpg'],
    creator: '@abrahamoflondon',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en-GB" 
      className={`${fontConfig.fontVariables} scroll-smooth theme-transition-app`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter/Inter-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/inter/Inter-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* Theme color */}
        <meta name="theme-color" content="#050608" />
        <meta name="color-scheme" content="dark light" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Font loading script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Add loading class
                  document.documentElement.classList.add('fontLoading');
                  
                  // Wait for fonts to load
                  if ('fonts' in document) {
                    document.fonts.ready.then(function() {
                      document.documentElement.classList.remove('fontLoading');
                      document.documentElement.classList.add('fontLoaded');
                      document.documentElement.classList.add('optimizeLegibility');
                    });
                  } else {
                    // Fallback for older browsers
                    setTimeout(function() {
                      document.documentElement.classList.remove('fontLoading');
                      document.documentElement.classList.add('fontLoaded');
                      document.documentElement.classList.add('optimizeLegibility');
                    }, 1000);
                  }
                  
                  // Theme detection
                  const theme = localStorage.getItem('theme') || 
                               (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.classList.add(theme);
                } catch (e) {
                  console.warn('Font loading error:', e);
                }
              })();
            `,
          }}
        />
        
        {/* Performance monitoring */}
        {process.env.NODE_ENV === 'production' && (
          <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          />
        )}
        
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-XXXXXXXXXX', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        )}
      </head>
      <body className={`${fontConfig.fontBodyClass} fontSans optimizeLegibility fontFadeIn`}>
        <div className="min-h-screen bg-background text-on-background">
          {children}
        </div>
        
        {/* Font loading indicator (hidden) */}
        <div 
          id="font-loading-indicator" 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
        >
          Fonts loading...
        </div>
      </body>
    </html>
  );
}
