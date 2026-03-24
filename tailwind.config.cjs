/** @type {import('tailwindcss').Config} */
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
        /* -----------------------------------------------------------------
           Core CSS-var driven semantic tokens
        ----------------------------------------------------------------- */
        background: "var(--aol-dark)",
        foreground: "var(--aol-ink)",
        border: "var(--aol-border)",
        surface: "var(--aol-surface)",
        "surface-2": "var(--aol-surface-2)",

        /* -----------------------------------------------------------------
           Brand namespace (preferred modern usage)
        ----------------------------------------------------------------- */
        brand: {
          obsidian: "var(--aol-dark)",
          charcoal: "var(--aol-darker)",
          cream: "var(--aol-ink)",
          "cream-dim": "var(--aol-ink-dim)",
          "cream-muted": "var(--aol-ink-muted)",
          gold: "var(--aol-gold)",
          amber: "var(--aol-gold-strong)",
          forest: "#0e3b33",
        },

        /* -----------------------------------------------------------------
           Legacy aliases used all over the estate
           These are the “do not break old pages” shims.
        ----------------------------------------------------------------- */
        softGold: "var(--aol-gold)",
        gold: "var(--aol-gold)",
        amber: "var(--aol-gold-strong)",

        cream: "var(--aol-ink)",
        warmWhite: "var(--aol-ink)",

        charcoal: "var(--aol-darker)",
        "charcoal-light": "#111111",
        deepCharcoal: "var(--aol-darker)",
        softBlack: "#080808",
        obsidian: "var(--aol-dark)",

        lightGrey: "rgba(255,255,255,0.14)",
        forest: "#0e3b33",

        /* Common UI aliases */
        card: "rgba(255,255,255,0.04)",
        "card-foreground": "var(--aol-ink)",
      },

      fontFamily: {
        sans: [
          "var(--font-family-sans)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        serif: [
          "var(--font-family-serif)",
          "Cormorant Garamond",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        mono: [
          "var(--font-family-mono)",
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

      /* -----------------------------------------------------------------
         Restored gradients / visual surfaces
      ----------------------------------------------------------------- */
      backgroundImage: {
        "gold-radial":
          "radial-gradient(circle at center, rgba(184,155,110,0.15) 0%, transparent 70%)",
        "premium-card":
          "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
        "gold-linear":
          "linear-gradient(to right, transparent, rgba(184,155,110,0.30), transparent)",
        "aol-hairline":
          "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)",
        "aol-hairline-gold":
          "linear-gradient(to right, transparent, rgba(245,158,11,0.30), transparent)",
      },

      boxShadow: {
        premium: "0 20px 40px -15px rgba(0,0,0,0.80)",
        card:
          "0 10px 30px -15px rgba(0,0,0,0.70), 0 1px 1px 0 rgba(255,255,255,0.05) inset",
        cardHover:
          "0 18px 40px -18px rgba(0,0,0,0.78), 0 1px 2px 0 rgba(255,255,255,0.06) inset",
        "gold-glow": "0 0 40px rgba(184,155,110,0.12)",
      },
    },
  },

  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
  ],
};