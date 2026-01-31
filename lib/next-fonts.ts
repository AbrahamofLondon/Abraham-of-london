// lib/next-fonts.ts — Merged Production Update
import { Inter, Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";

export const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-family-sans",
  weight: ["300", "400", "500", "600", "700", "900"],
  style: ["normal"],
  fallback: ["system-ui", "sans-serif"],
  preload: true,
});

export const fontMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-family-mono",
  weight: ["400", "500", "700"],
  style: ["normal"],
  fallback: ["ui-monospace", "monospace"],
  preload: true,
});

export const fontEditorial = localFont({
  src: [{ path: "../public/assets/fonts/EditorialNew-Regular.woff2", weight: "400", style: "normal" }],
  variable: "--font-editorial", // Kept your original variable
  display: "swap",
  preload: true,
  fallback: ["ui-serif", "serif"],
});

export const fontSerif = localFont({
  src: [{ path: "../public/assets/fonts/AoLSerif-Italic.ttf", weight: "400", style: "italic" }],
  variable: "--font-family-serif", // Kept your original variable
  display: "swap",
  preload: false,
  fallback: ["ui-serif", "serif"],
});

export const fontVariables = [
  fontSans.variable,
  fontMono.variable,
  fontEditorial.variable,
  fontSerif.variable,
].join(" ");

export const fontBodyClass = fontSans.className;

// Preserving your fontConfig for existing component references
export const fontConfig = {
  fontSans, fontMono, fontEditorial, fontSerif, fontVariables, fontBodyClass,
};