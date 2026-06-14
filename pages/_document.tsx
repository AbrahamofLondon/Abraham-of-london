// pages/_document.tsx — Pages Router only
// Using named import for Document to avoid webpack __esModule interop issue
import { Html, Head, Main, NextScript } from "next/document";
import type { DocumentContext, DocumentInitialProps } from "next/document";

// Import Document class directly via require to avoid webpack interop
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Document = require("next/document").default;

const BUILD_FINGERPRINT =
  process.env.NEXT_PUBLIC_BUILD_FINGERPRINT ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.COMMIT_REF ||
  process.env.NETLIFY_COMMIT_REF ||
  process.env.GITHUB_SHA ||
  "local-build";

const BUILD_CHANNEL = process.env.VERCEL
  ? "vercel"
  : process.env.NETLIFY
  ? "netlify"
  : "local";

export default class MyDocument extends Document {
  static async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html
        lang="en"
        className="scroll-smooth"
        data-scroll-behavior="smooth"
        data-aol-fp={BUILD_FINGERPRINT}
        data-aol-channel={BUILD_CHANNEL}
      >
        <Head>
          <meta name="theme-color" content="#854d0e" />
          <meta name="aol:fingerprint" content={BUILD_FINGERPRINT} />
          <meta name="aol:channel" content={BUILD_CHANNEL} />
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/favicon.ico" />

          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=JetBrains+Mono:wght@300;400;500&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body
          className="antialiased selection:bg-amber-500/30 selection:text-white"
          suppressHydrationWarning
        >
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}