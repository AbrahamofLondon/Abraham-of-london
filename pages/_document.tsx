// pages/_document.tsx — Pages Router only
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  type DocumentContext,
  type DocumentInitialProps,
} from "next/document";

// ----------------------------------------------------------------------------
// BUILD FINGERPRINT (deterministic + safe)
// Priority: explicit -> Vercel -> Netlify -> GitHub -> fallback
// ----------------------------------------------------------------------------
const BUILD_FINGERPRINT =
  process.env.NEXT_PUBLIC_BUILD_FINGERPRINT ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.COMMIT_REF ||
  process.env.NETLIFY_COMMIT_REF ||
  process.env.GITHUB_SHA ||
  "local";

const BUILD_CHANNEL = process.env.VERCEL ? "vercel" : process.env.NETLIFY ? "netlify" : "local";

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html
        lang="en-GB"
        className="scroll-smooth"
        data-aol-fp={BUILD_FINGERPRINT}
        data-aol-channel={BUILD_CHANNEL}
      >
        <Head>
          <meta charSet="utf-8" />
          <meta name="theme-color" content="#854d0e" />
          <meta name="aol:fingerprint" content={BUILD_FINGERPRINT} />
          <meta name="aol:channel" content={BUILD_CHANNEL} />

          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </Head>

        <body className="antialiased selection:bg-gold/30 selection:text-gold">
          {/* Theme bootstrap — must be tiny and dependency-free */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var k="aol-theme";var s=localStorage.getItem(k);var m=(s==="light"||s==="dark"||s==="system")?s:"system";var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var r=(m==="system")?(d?"dark":"light"):m;if(r==="dark")document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark");}catch(e){}})();`,
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}