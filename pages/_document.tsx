// pages/_document.tsx
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';
import { GA_MEASUREMENT_ID, gaEnabled } from '@/lib/gtag';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en-GB" className="scroll-smooth">
        <Head>
          {/* Color scheme + basic PWA meta (safe defaults) */}
          <meta name="color-scheme" content="dark light" />
          <meta name="format-detection" content="telephone=no" />

          {/* Preconnects (safe, low-cost) */}
          <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />
          <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="" />

          {/* GA4 script bootstrap (only if ID present) */}
          {gaEnabled && (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              />
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_MEASUREMENT_ID}', {
                      send_page_view: false
                    });
                  `.trim(),
                }}
              />
            </>
          )}

          {/* NOTE: If you host local fonts, add preload links here.
             Example:
             <link rel="preload" href="/fonts/YourFont-Var.woff2" as="font" type="font/woff2" crossOrigin="" />
          */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;

