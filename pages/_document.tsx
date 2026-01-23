// pages/_document.tsx
import Document, { Html, Head, Main, NextScript, DocumentContext } from "next/document";

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en-GB" className="dark">
        <Head>
          <meta charSet="utf-8" />
          <meta name="theme-color" content="#854d0e" />

          {/* Web App Manifest */}
          <link rel="manifest" href="/manifest.json" />
          
          {/* Icons */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/icons/icon-192.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
          <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192.png" />
          
          {/* Apple splash screen images (optional) */}
          <link
            rel="apple-touch-startup-image"
            href="/splash/apple-splash-2048-2732.png"
            media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/apple-splash-2732-2048.png"
            media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          />

          {/* Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap"
            rel="stylesheet"
          />

          {/* PWA Meta tags */}
          <meta name="application-name" content="Abraham of London" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Abraham of London" />
          <meta
            name="description"
            content="Faith-rooted strategy, fatherhood, and legacy for serious men and builders."
          />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          
          {/* Microsoft Tiles */}
          <meta name="msapplication-TileColor" content="#854d0e" />
          <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          
          {/* Twitter / Open Graph (basic) - detailed ones should be in page components */}
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:url" content="https://www.abrahamoflondon.org" />
          <meta name="twitter:title" content="Abraham of London" />
          <meta name="twitter:description" content="Faith-rooted strategy, fatherhood, and legacy for serious men and builders." />
          <meta name="twitter:image" content="https://www.abrahamoflondon.org/icons/icon-192.png" />
          <meta name="twitter:creator" content="@abrahamoflondon" />
          
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Abraham of London" />
          <meta property="og:description" content="Faith-rooted strategy, fatherhood, and legacy for serious men and builders." />
          <meta property="og:site_name" content="Abraham of London" />
          <meta property="og:url" content="https://www.abrahamoflondon.org" />
          <meta property="og:image" content="https://www.abrahamoflondon.org/icons/icon-512.png" />

          {/* IMPORTANT:
              Do NOT put reCAPTCHA script here. Put it in _app.tsx using next/script.
              That avoids bundling weirdness in Document build step.
           */}
        </Head>

        <body className="bg-white dark:bg-slate-950 font-sans antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;