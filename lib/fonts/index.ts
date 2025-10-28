// lib/fonts/index.ts
import localFont from "next/font/local";
import type { LocalFont } from "next/dist/compiled/@next/font"; // Internal type for robustness

// --- Configuration Constants ---

const FONT_DISPLAY = "swap"; // Use 'swap' for better perceived loading speed

// --- 1. Sans-Serif Font (Inter-Variable) ---

export const sansFont = localFont({
  src: [{ path: "./Inter-Variable.woff2", style: "normal", weight: "100 900" }],
  variable: "--font-family-sans", // More descriptive CSS variable
  display: FONT_DISPLAY,
  preload: true, // Preload the primary text font
  
  // CRITICAL: Add fallbacks to prevent Cumulative Layout Shift (CLS)
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "Noto Sans",
    "sans-serif",
    "Apple Color Emoji",
    "Segoe UI Emoji",
  ],
}) as LocalFont;

// --- 2. Serif Font (PlayfairDisplay-Variable) ---

export const serifFont = localFont({
  src: [
    {
      path: "./PlayfairDisplay-Variable.woff2",
      style: "normal",
      weight: "400 900",
    },
  ],
  variable: "--font-family-serif", // More descriptive CSS variable
  display: FONT_DISPLAY,
  preload: false,
  
  // Fallbacks for display/header font
  fallback: [
    "ui-serif",
    "Georgia",
    "Cambria",
    "Times New Roman",
    "Times",
    "serif",
  ],
}) as LocalFont;

// --- 3. Cursive/Display Font (GreatVibes-Regular) ---

export const cursiveFont = localFont({
  src: [{ path: "./GreatVibes-Regular.woff2", style: "normal", weight: "400" }],
  variable: "--font-family-cursive", // More descriptive CSS variable
  display: FONT_DISPLAY,
  preload: false,
  
  // Fallbacks for a cursive style
  fallback: [
    "cursive",
    "Apple Chancery",
    "Bradley Hand",
    "Zapf Chancery",
  ],
}) as LocalFont;

// --- Export Bundle for Layout ---

/**
 * Convenience array for injecting all font variables into the main HTML layout.
 */
export const fontClasses = [
    sansFont.variable, 
    serifFont.variable, 
    cursiveFont.variable
].join(" ");