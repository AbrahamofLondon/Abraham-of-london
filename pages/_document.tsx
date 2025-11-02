// pages/_document.tsx
import Document, { Html, Head, Main, NextScript, DocumentContext } from "next/document";

const USE_LOCAL_FONTS =
  process.env.PDF_ON_CI === "1" ||
  process.env.PDF_ON_CI === "true" ||
  process.env.NEXT_PUBLIC_PDF_ON_CI === "1" ||
  process.env.NEXT_PUBLIC_PDF_ON_CI === "true";

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* External Google Fonts (Standard Web Build) */}
          {!USE_LOCAL_FONTS ? (
            <>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
              <link
                href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap"
                rel="stylesheet"
              />
            </>
          ) : (
            // Local Fonts (PDF/CI Environment)
            <>
              <link
                rel="preload"
                href="/fonts/Inter-Variable.woff2"
                as="font"
                type="font/woff2"
                crossOrigin="anonymous"
              />
              <link
                rel="preload"
                href="/fonts/PlayfairDisplay-Variable.woff2"
                as="font"
                type="font/woff2"
                crossOrigin="anonymous"
              />
            </>
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}