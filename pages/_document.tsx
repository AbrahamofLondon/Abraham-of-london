import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from "next/document";

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en-GB">
        <Head>
          <meta charSet="utf-8" />
          <meta name="theme-color" content="#854d0e" />

          {/* Zero-flash theme guard */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
(function() {
  try {
    var key = "aol-theme";
    var stored = localStorage.getItem(key);
    var mode = (stored === "light" || stored === "dark" || stored === "system") ? stored : "system";
    var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolved = (mode === "system") ? (systemDark ? "dark" : "light") : mode;
    if (resolved === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  } catch (e) {}
})();`,
            }}
          />

          {/* Manifest */}
          <link rel="manifest" href="/manifest.json" />

          {/* Favicon */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/icons/icon-192.png" />

          {/* Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap"
            rel="stylesheet"
          />

          {/* Basic OG */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Abraham of London" />
          <meta property="og:description" content="Institutional Intelligence and Strategic Resilience." />
          <meta property="og:site_name" content="Abraham of London" />
          <meta property="og:image" content="https://www.abrahamoflondon.org/icons/icon-512.png" />
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