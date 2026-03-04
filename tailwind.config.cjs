// tailwind.config.js — LEGIBILITY + LUXURY CONSISTENCY
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],

  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
    "./.contentlayer/**/*.{json,js,ts}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "3rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
    },

    extend: {
      colors: {
        background: "var(--aol-dark)",
        foreground: "var(--aol-ink)",
        surface: "rgb(255 255 255 / 0.04)",
        border: "rgb(255 255 255 / 0.12)",

        brand: {
          obsidian: "var(--aol-dark)",
          charcoal: "var(--aol-darker)",
          cream: "var(--aol-ink)",
          amber: "var(--aol-gold-strong)",
          gold: "var(--aol-gold)",
        },

        primary: {
          DEFAULT: "#f59e0b",
          light: "#fbbf24",
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
      },

      fontFamily: {
        sans: [
          "var(--font-family-sans)",
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "var(--font-family-mono)",
          "JetBrains Mono",
          "Fira Code",
          "Cascadia Code",
          "ui-monospace",
          "SFMono-Regular",
          "Consolas",
          "Monaco",
          "monospace",
        ],
        serif: [
          "var(--font-family-serif)",
          "Cormorant Garamond",
          "Cormorant",
          "Garamond",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
      },

      fontSize: {
        "4xs": ["0.5rem", { lineHeight: "0.7rem", letterSpacing: "0.12em" }],
        "3xs": ["0.625rem", { lineHeight: "0.85rem", letterSpacing: "0.2em" }],
        "2xs": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.05em" }],
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3.5rem",
      },

      boxShadow: {
        premium: "0 20px 40px -15px rgba(0, 0, 0, 0.6)",
        card: "0 10px 30px -15px rgba(0, 0, 0, 0.6), 0 1px 2px 0 rgba(255, 255, 255, 0.04) inset",
        "gold-glow": "0 0 30px rgba(245, 158, 11, 0.14)",
      },

      typography: {
        DEFAULT: {
          css: {
            color: "var(--aol-ink-dim)",
            a: {
              color: "rgba(245, 158, 11, 0.95)",
              textDecorationColor: "rgba(245, 158, 11, 0.35)",
              textUnderlineOffset: "3px",
              "&:hover": { textDecorationColor: "rgba(245, 158, 11, 0.7)" },
            },
            h1: { color: "var(--aol-ink)" },
            h2: { color: "var(--aol-ink)" },
            h3: { color: "var(--aol-ink)" },
            strong: { color: "var(--aol-ink)" },
            code: {
              color: "var(--aol-ink)",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "0.5rem",
              padding: "0.15rem 0.35rem",
            },
            pre: {
              backgroundColor: "rgba(0,0,0,0.75)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "1rem",
            },
            blockquote: {
              color: "var(--aol-ink-muted)",
              borderLeftColor: "rgba(245,158,11,0.35)",
            },
          },
        },
      },

      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },

      backdropBlur: { xs: "2px", "2xl": "40px" },
      maxWidth: { "8xl": "1440px", "9xl": "1600px" },
      screens: { xs: "475px" },
    },
  },

  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/line-clamp"),
  ],
};