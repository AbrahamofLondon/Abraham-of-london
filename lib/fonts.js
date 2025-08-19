// lib/fonts.ts
import { Inter, Playfair_Display } from "next/font/google";
import { Great_Vibes } from "next/font/google"; // ✨ add this

export const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const serif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const cursive = Great_Vibes({   // ✨ cursive
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cursive",
});
