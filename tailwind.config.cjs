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
      // ── TYPOGRAPHY ──────────────────────────────────────────────────────────
      // Cormorant Garamond loaded via Google Fonts in _document.tsx
      // JetBrains Mono loaded via Google Fonts in _document.tsx
      // CSS vars --font-serif and --font-mono set in globals.css
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

      // ── FONT SIZES ──────────────────────────────────────────────────────────
      fontSize: {
        "4xs": ["0.5rem",   { lineHeight: "0.7rem",  letterSpacing: "0.12em" }],
        "3xs": ["0.625rem", { lineHeight: "0.85rem", letterSpacing: "0.20em" }],
        "2xs": ["0.75rem",  { lineHeight: "1rem",    letterSpacing: "0.05em" }],
      },

      // ── LETTER SPACING ──────────────────────────────────────────────────────
      letterSpacing: {
        institutional: "0.28em",
        command:       "0.34em",
        forensic:      "0.40em",
        wide4:         "0.04em",
        wide8:         "0.08em",
      },

      // ── COLOURS ─────────────────────────────────────────────────────────────
      // All CSS variable bindings. Variables defined in globals.css.
      colors: {
        // Semantic system tokens
        background:    "rgb(var(--aol-bg)     / <alpha-value>)",
        foreground:    "rgb(var(--aol-ink)    / <alpha-value>)",
        border:        "rgb(255 255 255      / 0.14)",
        input:         "rgb(255 255 255      / 0.14)",
        ring:          "rgb(var(--aol-gold)   / <alpha-value>)",

        // Surface scale
        surface:    "rgb(var(--aol-bg-3) / <alpha-value>)",
        "surface-2": "rgb(18 18 22 / <alpha-value>)",
        "surface-3": "rgb(24 24 30 / <alpha-value>)",

        // Card
        card:            "rgb(var(--aol-bg-3) / <alpha-value>)",
        "card-foreground": "rgb(var(--aol-ink) / <alpha-value>)",
        aol: {
          base: "rgb(var(--aol-bg) / <alpha-value>)",
          void: "rgb(3 3 5 / <alpha-value>)",
          panel: "rgb(var(--aol-bg-3) / <alpha-value>)",
          heading: "rgb(255 255 255 / 0.94)",
          body: "rgb(255 255 255 / 0.84)",
          muted: "rgb(255 255 255 / 0.68)",
          dim: "rgb(255 255 255 / 0.46)",
          faint: "rgb(255 255 255 / 0.36)",
          "border": "rgb(255 255 255 / 0.14)",
          "border-strong": "rgb(255 255 255 / 0.20)",
        },

        // Full brand namespace
        brand: {
          obsidian:      "rgb(var(--aol-bg)        / <alpha-value>)",
          "obsidian-2":  "rgb(var(--aol-bg-2)      / <alpha-value>)",
          charcoal:      "rgb(var(--aol-bg-3)      / <alpha-value>)",
          panel:         "rgb(var(--aol-panel)     / <alpha-value>)",
          "panel-2":     "rgb(var(--aol-panel-2)   / <alpha-value>)",
          "panel-3":     "rgb(var(--aol-panel-3)   / <alpha-value>)",
          cream:         "rgb(var(--aol-ink)       / <alpha-value>)",
          "cream-dim":   "rgb(var(--aol-ink-dim)   / <alpha-value>)",
          "cream-muted": "rgb(var(--aol-ink-muted) / <alpha-value>)",
          gold:          "rgb(var(--aol-gold)      / <alpha-value>)",
          "gold-strong": "rgb(var(--aol-gold-strong) / <alpha-value>)",
          "gold-soft":   "rgb(var(--aol-gold-soft)   / <alpha-value>)",
          danger:        "rgb(var(--aol-danger)    / <alpha-value>)",
          success:       "rgb(var(--aol-success)   / <alpha-value>)",
          warning:       "rgb(var(--aol-warning)   / <alpha-value>)",
        },

        // Convenience aliases (used throughout existing components)
        softGold:       "rgb(var(--aol-gold)        / <alpha-value>)",
        gold:           "rgb(var(--aol-gold)        / <alpha-value>)",
        amber:          "rgb(var(--aol-gold-strong)  / <alpha-value>)",
        cream:          "rgb(var(--aol-ink)          / <alpha-value>)",
        warmWhite:      "rgb(var(--aol-ink)          / <alpha-value>)",
        charcoal:       "rgb(var(--aol-bg-3)         / <alpha-value>)",
        "charcoal-light": "rgb(22 22 24              / <alpha-value>)",
        deepCharcoal:   "rgb(var(--aol-bg-2)         / <alpha-value>)",
        softBlack:      "rgb(var(--aol-bg)           / <alpha-value>)",
        obsidian:       "rgb(var(--aol-bg)           / <alpha-value>)",
        lightGrey:      "rgb(255 255 255 / 0.14)",
        forest:         "#0e3b33",
      },

      // ── TIMING ──────────────────────────────────────────────────────────────
      transitionDuration: {
        "400":   "400ms",
        "4000":  "4000ms",
        "10000": "10000ms",
      },

      // ── BORDER RADIUS ───────────────────────────────────────────────────────
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3.5rem",
      },

      // ── MAX WIDTH ───────────────────────────────────────────────────────────
      maxWidth: {
        "8xl": "96rem",
        "9xl": "112rem",
      },

      // ── MIN HEIGHT ──────────────────────────────────────────────────────────
      minHeight: {
        hero: "620px",
      },

      // ── Z-INDEX ─────────────────────────────────────────────────────────────
      zIndex: {
        60:  "60",
        70:  "70",
        80:  "80",
        90:  "90",
        100: "100",
        110: "110",
      },

      // ── BACKDROP ────────────────────────────────────────────────────────────
      backdropBlur: {
        xs: "2px",
      },

      // ── BACKGROUND IMAGES ───────────────────────────────────────────────────
      backgroundImage: {
        "gold-radial":    "radial-gradient(circle at center, rgba(201,169,106,0.10) 0%, transparent 70%)",
        "premium-card":   "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.00) 100%)",
        "gold-linear":    "linear-gradient(to right, transparent, rgba(201,169,106,0.36), transparent)",
        "aol-hairline":   "linear-gradient(to right, transparent, rgba(255,255,255,0.14), transparent)",
        "aol-hairline-gold": "linear-gradient(to right, transparent, rgba(201,169,106,0.36), transparent)",
        "terminal-core":  "radial-gradient(circle at 50% 0%, rgba(201,169,106,0.04), transparent 32%), linear-gradient(180deg, rgba(12,12,14,0.99), rgba(6,6,9,1))",
      },

      // ── BOX SHADOWS ─────────────────────────────────────────────────────────
      boxShadow: {
        premium:   "0 20px 48px -24px rgba(0,0,0,0.90)",
        card:      "0 24px 72px -34px rgba(0,0,0,0.92), 0 1px 0 0 rgba(255,255,255,0.04) inset",
        cardHover: "0 30px 84px -36px rgba(0,0,0,0.94), 0 1px 0 0 rgba(255,255,255,0.05) inset, 0 0 28px rgba(201,169,106,0.05)",
        "gold-glow": "0 0 28px rgba(201,169,106,0.10)",
        terminal:  "0 28px 90px rgba(0,0,0,0.46), 0 1px 0 rgba(255,255,255,0.04) inset",
      },
    },
  },

  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
    require("tailwindcss-animate"),
  ],
};
