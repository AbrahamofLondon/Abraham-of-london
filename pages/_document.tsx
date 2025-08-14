// pages/_document.tsx
import Document, { Html, Head, Main, NextScript, DocumentContext } from "next/document";
import { GA_MEASUREMENT_ID, gaEnabled } from "@/lib/gtag";

const THEME_BOOTSTRAP = `
(function(){
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored ? stored : (prefersDark ? 'dark' : 'light');
    var root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    root.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en-GB" className="scroll-smooth" suppressHydrationWarning>
        <Head>
          <meta charSet="utf-8" />
          <meta name="color-scheme" content="dark light" />
          <meta name="format-detection" content="telephone=no" />

          <meta name="theme-color" content="#0b1a2b" media="(prefers-color-scheme: dark)" />
          <meta name="theme-color" content="#ffffff"  media="(prefers-color-scheme: light)" />

          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
          <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />

          <script id="theme-bootstrap" dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />

          {gaEnabled && (
            <>
              <script async id="ga4-src" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
              <script
                id="ga4-init"
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
                  `.trim(),
                }}
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

export default MyDocument;



