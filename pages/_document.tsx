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

          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/assets/icons/web-app-manifest-192x192.png" />

          {/* Fonts (OK in _document) */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap"
            rel="stylesheet"
          />

          {/* Meta basics */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Abraham of London" />
          <meta
            name="description"
            content="Faith-rooted strategy, fatherhood, and legacy for serious men and builders."
          />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />

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