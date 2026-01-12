// lib/next-fonts.ts
import { Inter, Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";

export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
  weight: ["100","200","300","400","500","600","700","800","900"],
  style: ["normal", "italic"],
  fallback: ["system-ui", "sans-serif"],
  preload: true,
  adjustFontFallback: true,
});

export const robotoMono = Roboto_Mono({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  fallback: ["monospace"],
});

export const editorialFont = localFont({
  src: [
    {
      path: "../public/fonts/EditorialNew-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    // If you *don’t* have italics/bold files, don’t list them.
  ],
  variable: "--font-editorial",
  display: "swap",
});

export const fontVariables = `${inter.variable} ${robotoMono.variable} ${editorialFont.variable}`;
export const fontBodyClass = inter.className;

export const fontConfig = {
  inter,
  robotoMono,
  editorialFont,
  fontVariables,
  fontBodyClass,
};