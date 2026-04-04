// tailwind.config.js
/** @type {import("tailwindcss").Config} */
module.exports = {
  darkMode: "class",

  content: [
    "./pages/**/*.{js,ts,jsx,tsx,md,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,md,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,md,mdx}",
    "./layouts/**/*.{js,ts,jsx,tsx,md,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,md,mdx}",
    "./content/**/*.{md,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,md,mdx}",
    "./.contentlayer/generated/**/*.{js,ts,jsx,tsx}",
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
        background: "rgb(var(--aol-bg) / <alpha-value>)",
        foreground: "rgb(var(--aol-ink) / <alpha-value>)",
        border: "rgb(255 255 255 / 0.1)",
        input: "rgb(255 255 255 / 0.1)",
        ring: "rgb(var(--aol-gold) / <alpha-value>)",

        surface: "rgb(15 15 17 / <alpha-value>)",
        "surface-2": "rgb(19 19 22 / <alpha-value>)",
        "surface-3": "rgb(24 24 28 / <alpha-value>)",

        card: "rgb(15 15 17 / <alpha-value>)",
        "card-foreground": "rgb(var(--aol-ink) / <alpha-value>)",

        brand: {
          obsidian: "rgb(var(--aol-bg) / <alpha-value>)",
          "obsidian-2": "rgb(var(--aol-bg-2) / <alpha-value>)",
          charcoal: "rgb(var(--aol-bg-3) / <alpha-value>)",
          panel: "rgb(var(--aol-panel) / <alpha-value>)",
          "panel-2": "rgb(var(--aol-panel-2) / <alpha-value>)",
          "panel-3": "rgb(var(--aol-panel-3) / <alpha-value>)",
          cream: "rgb(var(--aol-ink) / <alpha-value>)",
          "cream-dim": "rgb(var(--aol-ink-dim) / <alpha-value>)",
          "cream-muted": "rgb(var(--aol-ink-muted) / <alpha-value>)",
          gold: "rgb(var(--aol-gold) / <alpha-value>)",
          "gold-strong": "rgb(var(--aol-gold-strong) / <alpha-value>)",
          "gold-soft": "rgb(var(--aol-gold-soft) / <alpha-value>)",
          danger: "rgb(var(--aol-danger) / <alpha-value>)",
          success: "rgb(var(--aol-success) / <alpha-value>)",
          warning: "rgb(var(--aol-warning) / <alpha-value>)",
        },

        /* Compatibility shims */
        softGold: "rgb(var(--aol-gold) / <alpha-value>)",
        gold: "rgb(var(--aol-gold) / <alpha-value>)",
        amber: "rgb(var(--aol-gold-strong) / <alpha-value>)",
        cream: "rgb(var(--aol-ink) / <alpha-value>)",
        warmWhite: "rgb(var(--aol-ink) / <alpha-value>)",
        charcoal: "rgb(var(--aol-bg-3) / <alpha-value>)",
        "charcoal-light": "rgb(22 22 24 / <alpha-value>)",
        deepCharcoal: "rgb(var(--aol-bg-2) / <alpha-value>)",
        softBlack: "rgb(var(--aol-bg) / <alpha-value>)",
        obsidian: "rgb(var(--aol-bg) / <alpha-value>)",
        lightGrey: "rgb(255 255 255 / 0.14)",
        forest: "#0e3b33",
      },

      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        serif: [
          "var(--font-serif)",
          "Cormorant Garamond",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },

      fontSize: {
        "4xs": ["0.5rem", { lineHeight: "0.7rem", letterSpacing: "0.12em" }],
        "3xs": ["0.625rem", { lineHeight: "0.85rem", letterSpacing: "0.2em" }],
        "2xs": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.05em" }],
      },

      letterSpacing: {
        institutional: "0.28em",
        command: "0.34em",
        forensic: "0.4em",
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3.5rem",
      },

      maxWidth: {
        "8xl": "96rem",
        "9xl": "112rem",
      },

      minHeight: {
        hero: "620px",
      },

      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
        110: "110",
      },

      backdropBlur: {
        xs: "2px",
      },

      backgroundImage: {
        "gold-radial":
          "radial-gradient(circle at center, rgba(201,169,106,0.15) 0%, transparent 70%)",
        "premium-card":
          "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.018) 100%)",
        "gold-linear":
          "linear-gradient(to right, transparent, rgba(201,169,106,0.30), transparent)",
        "aol-hairline":
          "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)",
        "aol-hairline-gold":
          "linear-gradient(to right, transparent, rgba(201,169,106,0.30), transparent)",
        "terminal-core":
          "radial-gradient(circle at 50% 0%, rgba(201,169,106,0.06), transparent 32%), linear-gradient(180deg, rgba(9,9,10,0.98), rgba(4,4,5,1))",
      },

      boxShadow: {
        premium: "0 20px 40px -15px rgba(0,0,0,0.80)",
        card:
          "0 20px 60px -24px rgba(0,0,0,0.74), 0 1px 1px 0 rgba(255,255,255,0.045) inset",
        cardHover:
          "0 28px 80px -30px rgba(0,0,0,0.82), 0 1px 2px 0 rgba(255,255,255,0.05) inset, 0 0 36px rgba(201,169,106,0.06)",
        "gold-glow": "0 0 40px rgba(201,169,106,0.12)",
        terminal:
          "0 28px 90px rgba(0,0,0,0.46), 0 1px 0 rgba(255,255,255,0.04) inset",
      },
    },
  },

  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
  ],
};