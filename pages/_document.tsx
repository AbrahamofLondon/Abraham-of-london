// pages/_document.tsx — Pages Router only
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  type DocumentContext,
  type DocumentInitialProps,
} from "next/document";

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