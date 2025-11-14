// pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en-GB" className="dark">
      <Head>
        {/* Charset */}
        <meta charSet="utf-8" />

        {/* PWA manifest (adjust path if your manifest is elsewhere) */}
        {/* If you don't have a manifest yet, comment this out to avoid 404s */}
        {/* <link rel="manifest" href="/manifest.json" /> */}
        <meta name="theme-color" content="#854d0e" />

        {/* Favicon & icons */}
        <link rel="icon" href="/favicon.ico" />
        {/* Known icon paths from your asset structure */}
        <link
          rel="apple-touch-icon"
          href="/assets/icons/web-app-manifest-192x192.png"
        />

        {/* Google Fonts – Inter & Playfair Display */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap"
          rel="stylesheet"
        />

        {/* PWA / meta basics */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Abraham of London" />
        <meta
          name="description"
          content="Faith-rooted strategy, fatherhood, and legacy for serious men and builders."
        />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>
      <body className="bg-white dark:bg-slate-950 font-sans antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}