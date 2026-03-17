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
  // ✅ Add 'override' to getInitialProps
  static override async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  // ✅ Add 'override' to render
  override render() {
    return (
      <Html
        lang="en"
        className="scroll-smooth"
        data-scroll-behavior="smooth"
        data-aol-fp={BUILD_FINGERPRINT}
        data-aol-channel={BUILD_CHANNEL}
        data-new-gr-c-s-check-loaded
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

          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    const k = "aol-theme";
                    const s = localStorage.getItem(k);
                    const m = (s === "light" || s === "dark" || s === "system") ? s : "system";
                    const d = window.matchMedia("(prefers-color-scheme: dark)").matches;
                    const r = (m === "system") ? (d ? "dark" : "light") : m;
                    if (r === "dark") {
                      document.documentElement.classList.add("dark");
                    } else {
                      document.documentElement.classList.remove("dark");
                    }
                  } catch (e) {}
                })();
              `,
            }}
          />
        </Head>

        <body
          className="antialiased selection:bg-gold/30 selection:text-gold"
          suppressHydrationWarning
        >
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}