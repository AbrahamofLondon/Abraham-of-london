// pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

const THEME_BOOTSTRAP = `
(function () {
  try {
    var d = document.documentElement;
    var stored = localStorage.getItem('theme'); // "light"|"dark"|"system"|null
    var m = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    var sysDark = !!(m && m.matches);
    var pref = (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'system';
    var resolved = (pref === 'dark') ? 'dark' : (pref === 'light') ? 'light' : (sysDark ? 'dark' : 'light');
    if (resolved === 'dark') d.classList.add('dark'); else d.classList.remove('dark');
    d.setAttribute('data-theme', resolved);
    d.setAttribute('data-user-theme', pref);
  } catch (e) { /* ignore */ }
})();
`.trim();

export default function Document() {
  // Optional GA preconnect if env present (cheap perf win)
  const hasGA = !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <Html lang="en-GB" className="scroll-smooth" suppressHydrationWarning>
      <Head>
        <meta charSet="utf-8" />
        <meta name="color-scheme" content="dark light" />

        {/* Theme bootstrap before paint (prevents flash) */}
        <script id="theme-bootstrap" dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />

        {/* Icons / PWA */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#0b2e1f" />
        <meta name="theme-color" content="#0b2e1f" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />

        {/* Optional: performance hints */}
        {hasGA && (
          <>
            <link rel="preconnect" href="https://www.google-analytics.com" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
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
