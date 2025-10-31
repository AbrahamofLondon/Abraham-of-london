/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

module.exports = {
  // Enables dark mode based on the 'class' selector, necessary for Next-Themes
  darkMode: "class",

  // Configure files to scan for utility classes
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.css",
  ],

  theme: {
    // --- Container Defaults ---
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem", xl: "3rem" },
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        // --- 1. LUXURY PALETTE ---
        "deep-forest": "#0B2E1F",
        "warm-cream": "#FAF7F2",
        "muted-gold": "#C5A352",
        "soft-charcoal": "#333333",
        "light-gray": "#E5E5E5",
        "subtle-green": "#4B8B6B",
        
        // --- 2. CSS VARIABLE MAPPING (for Theme) ---
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "on-primary": "var(--color-on-primary)",
        secondary: "var(--color-secondary)",
        "on-secondary": "var(--color-on-secondary)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "on-accent": "var(--color-on-accent)",

        // --- 3. ALIASES ---
        "ui-border": "var(--color-lightGrey)",
        emerald: { ...colors.emerald, 700: "#047857" },
      },
      ringColor: {
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
      },
      borderColor: {
        primary: "var(--color-primary)",
        "ui-border": "var(--color-lightGrey)",
      },
      fontFamily: {
        serif: ["var(--font-family-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-family-sans)", "Inter", "system-ui", "sans-serif"],
        cursive: ["var(--font-family-cursive)", "Great Vibes", "cursive"],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": theme("colors.on-secondary"),
            "--tw-prose-headings": theme("colors.primary"),
            "--tw-prose-links": theme("colors.primary"),
            "--tw-prose-bullets": theme("colors.accent"),
            "--tw-prose-counters": theme("colors.accent"),
            "--tw-prose-quote-borders": theme("colors.accent"),
            p: { lineHeight: "1.85" },
            a: {
              textDecoration: "none",
              fontWeight: "500",
              transition: "color .15s ease",
              "&:hover": { color: theme("colors.accent-hover") },
            },
            h1: { fontFamily: theme("fontFamily.serif").join(", ") },
            h2: { fontFamily: theme("fontFamily.serif").join(", ") },
            strong: { fontWeight: "700", color: theme("colors.primary") },
            blockquote: {
              borderLeftColor: theme("colors.accent"),
              fontStyle: "italic",
              color: theme("colors.on-secondary"),
            },
          },
        },
        invert: {
          css: {
            "--tw-prose-body": theme("colors.on-secondary"),
            "--tw-prose-headings": theme("colors.primary"),
            "--tw-prose-links": theme("colors.accent"),
            "--tw-prose-bullets": theme("colors.accent"),
            "--tw-prose-counters": theme("colors.accent"),
            "--tw-prose-quote-borders": theme("colors.accent"),
            blockquote: {
              borderLeftColor: theme("colors.accent"),
              color: theme("colors.on-secondary"),
            },
            strong: { color: theme("colors.on-secondary") },
          },
        },
      }),
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};