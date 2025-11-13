/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
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
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        "2xl": "4rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // --- LUXURY PALETTE DEFINITIONS ---
        // Primary: Deep Forest Green (Rich, Classic)
        "deep-forest": "#0B2E1F",
        // Cream/Background: Warm Ivory (Luxury Paper Feel)
        "warm-cream": "#FAF7F2",
        // Accent: Muted Gold (Classic Opulence)
        "muted-gold": "#C5A352",
        // Text: Charcoal (Soft, highly readable black)
        "soft-charcoal": "#333333",
        // Supporting Colors
        "light-gray": "#E5E5E5",
        "subtle-green": "#4B8B6B", // Retained for bullets/links

        // --- MAPPING CUSTOM NAMES TO NEW LUXURY PALETTE ---
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "on-primary": "var(--color-on-primary)",
        "on-primary-hover": "var(--color-on-primary-hover)",
        secondary: "var(--color-secondary)",
        "on-secondary": "var(--color-on-secondary)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "on-accent": "var(--color-on-accent)",

        // Internal aliases
        forest: "#0B2E1F", // Used for headings
        deepCharcoal: "#333333", // Used for body text
        cream: "#FAF7F2", // Used for light backgrounds

        // Original aliases now using new values
        lightGrey: "#E5E5E5",
        warmWhite: "#FAF7F2",
        midGreen: "#4B8B6B",
        softGold: "#C5A352",

        emerald: { ...colors.emerald, 700: "#047857" },
      },
      ringColor: {
        forest: "var(--color-primary)",
      },
      borderColor: {
        forest: "var(--color-primary)",
        lightGrey: "#e5e5e5",
      },
      fontFamily: {
        // Serif: authority & elegance
        serif: ["var(--font-serif)", '"Playfair Display"', "Georgia", "serif"],
        // Sans: modern readability
        sans: ["var(--font-sans)", '"Inter"', "system-ui", "sans-serif"],
        cursive: ["var(--font-cursive)", "cursive"],
      },
      // This config is safe even if the plugin is not loaded;
      // Tailwind will just ignore it without the typography plugin.
      typography: (theme) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": theme("colors.soft-charcoal"),
            "--tw-prose-headings": theme("colors.forest"),
            "--tw-prose-links": theme("colors.forest"),
            "--tw-prose-bullets": theme("colors.subtle-green"),
            "--tw-prose-counters": theme("colors.subtle-green"),
            p: {
              lineHeight: "1.85",
            },
            a: {
              textDecoration: "none",
              fontWeight: "500",
              transition: "color .15s ease",
              "&:hover": {
                color: theme("colors.softGold"),
              },
            },
            h1: {
              letterSpacing: "-0.015em",
              lineHeight: "1.1",
              marginBottom: "0.8rem",
              fontFamily: theme("fontFamily.serif").join(", "),
            },
            h2: {
              letterSpacing: "-0.01em",
              lineHeight: "1.2",
              marginTop: "2.5rem",
              marginBottom: "0.8rem",
              fontFamily: theme("fontFamily.serif").join(", "),
            },
            strong: {
              fontWeight: "700",
            },
            blockquote: {
              borderLeftColor: theme("colors.softGold"),
              fontStyle: "italic",
              color: theme("colors.soft-charcoal"),
            },
            hr: {
              borderColor: theme("colors.lightGrey"),
            },
            ul: {
              paddingLeft: "1.5rem",
            },
            "ul > li::marker": {
              color: theme("colors.subtle-green"),
            },
          },
        },
        invert: {
          css: {
            "--tw-prose-body": theme("colors.warm-cream"),
            "--tw-prose-headings": theme("colors.warm-cream"),
            "--tw-prose-links": theme("colors.softGold"),
            blockquote: {
              borderLeftColor: theme("colors.softGold"),
              color: theme("colors.warm-cream"),
            },
          },
        },
      }),
    },
  },
  plugins: [
    // If/when you want the typography plugin back:
    // 1) pnpm add -D @tailwindcss/typography
    // 2) Uncomment the line below
    // require("@tailwindcss/typography"),
  ],
};