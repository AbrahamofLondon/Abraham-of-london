// pages/_document.tsx
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
      <Head />
      <body>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
