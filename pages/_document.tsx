// pages/_document.tsx — Pages Router only
import Document, { Html, Head, Main, NextScript } from "next/document";
import type { DocumentContext, DocumentInitialProps } from "next/document";

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
  static override async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  override render() {
    return (
      <Html lang="en-GB">
        <Head>
          <meta charSet="utf-8" />
          <meta name="build-fingerprint" content={BUILD_FINGERPRINT} />
          <meta name="build-channel" content={BUILD_CHANNEL} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
