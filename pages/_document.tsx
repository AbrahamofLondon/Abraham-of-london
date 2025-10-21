// pages/_document.tsx (Updated)
import { Html, Head, Main, NextScript } from "next/document";

const noFlashTheme = `
(function() {
  try {
    var d = document.documentElement;
    var pref = localStorage.getItem("theme");
    var mql = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    var dark = pref === "dark" || (pref !== "light" && mql && mql.matches);
    d.classList.toggle("dark", !!dark);
    d.setAttribute("data-theme", dark ? "dark" : "light");
    if (pref) d.setAttribute("data-user-theme", pref);
  } catch (e) {}
})();
`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* UPGRADE: Preload Luxury Fonts for fast rendering and no FOUT */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Example: Replace with your actual font URLs, using 'Playfair Display' for serif and 'Inter' for sans */}
        <link 
            href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap" 
            rel="stylesheet" 
        />
        
        {/* Note: If you are using local font files, use <link rel="preload" ...> tags instead. */}
      </Head>
      <body>
        {/* Run before Main to avoid theme flash */}
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}