// pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

// Runs before React hydration to prevent theme flash.
// 1) Use saved preference if present
// 2) Otherwise respect prefers-color-scheme
const noFlashTheme = `
(function () {
  try {
    var d = document.documentElement;
    var pref = localStorage.getItem('theme');
    var mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    var dark = pref ? (pref === 'dark') : (mql && mql.matches);
    if (dark) {
      d.classList.add('dark');
      d.setAttribute('data-theme', 'dark');
    } else {
      d.classList.remove('dark');
      d.setAttribute('data-theme', 'light');
    }
    if (pref) d.setAttribute('data-user-theme', pref);
  } catch (e) {}
})();
`;

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        {/* Ensure theme is applied before any paint */}
        <script
          id="no-flash-theme"
          dangerouslySetInnerHTML={{ __html: noFlashTheme }}
        />

        {/* Performance: help the font connections warm up */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Serif (Playfair Display) + Sans (Inter). You can swap to local WOFF2 below. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />

        {/* Hint the UA we support both color schemes (pairs with your CSS tokens) */}
        <meta name="color-scheme" content="light dark" />

        {/* Print fidelity: Some Chromium builds heed this for color accuracy */}
        <meta name="forced-color-adjust" content="none" />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
