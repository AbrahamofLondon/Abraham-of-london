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
  } catch (e) {}
})();
`.trim();

export default function Document() {
  return (
    <Html lang="en-GB" className="scroll-smooth" suppressHydrationWarning>
      <Head>
        <meta charSet="utf-8" />
        <meta name="color-scheme" content="dark light" />
        <script id="theme-bootstrap" dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
