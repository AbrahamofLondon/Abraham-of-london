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
      colors: {
        // Semantic system tokens
        background:    "rgb(var(--aol-bg)     / <alpha-value>)",
        foreground:    "rgb(var(--aol-ink)    / <alpha-value>)",
        border:        "rgb(255 255 255      / 0.12)",
        input:         "rgb(255 255 255      / 0.12)",
        ring:          "rgb(var(--aol-gold)   / <alpha-value>)",

        // Surface scale
        surface:        "rgb(14 14 18 / <alpha-value>)",
        "surface-2":    "rgb(9 9 12 / <alpha-value>)",
        "surface-3":    "rgb(6 6 9 / <alpha-value>)",

        // Surface-aware tokens (for federated surfaces)
        "surface-bg":         "rgb(var(--surface-bg, var(--aol-bg)) / <alpha-value>)",
        "surface-bg-muted":   "rgb(var(--surface-bg-muted, var(--aol-bg-2)) / <alpha-value>)",
        "surface-panel":      "rgb(var(--surface-panel, var(--aol-panel)) / <alpha-value>)",
        "surface-panel-alt":  "rgb(var(--surface-panel-alt, var(--aol-panel-2)) / <alpha-value>)",
        "surface-border":     "rgb(var(--surface-border, 255 255 255) / <alpha-value> / 0.12)",
        "surface-text":       "rgb(var(--surface-text, var(--aol-ink)) / <alpha-value>)",
        "surface-text-muted": "rgb(var(--surface-text-muted, var(--aol-ink-muted)) / <alpha-value>)",
        "surface-accent":     "rgb(var(--surface-accent, var(--aol-gold)) / <alpha-value>)",
        "surface-accent-soft":"rgb(var(--surface-accent-soft, var(--aol-gold-soft)) / <alpha-value>)",

        aol: {
          void:      "rgb(3 3 5 / <alpha-value>)",
          base:      "rgb(6 6 9 / <alpha-value>)",
          lifted:    "rgb(9 9 12 / <alpha-value>)",
          panel:     "rgb(14 14 18 / <alpha-value>)",
          heading:   "rgb(255 255 255 / 0.98)",
          body:      "rgb(255 255 255 / 0.92)",
          muted:     "rgb(255 255 255 / 0.78)",
          dim:       "rgb(255 255 255 / 0.65)",
          faint:     "rgb(255 255 255 / 0.48)",
          gold:      "rgb(201 169 110 / <alpha-value>)",
          "gold-strong": "rgb(212 175 55 / <alpha-value>)",
          "gold-soft":   "rgb(201 169 110 / 0.24)",
          amber:     "rgb(245 158 11 / <alpha-value>)",
          "border-subtle":  "rgb(255 255 255 / 0.08)",
          "border-panel":   "rgb(255 255 255 / 0.12)",
          "border-strong":  "rgb(255 255 255 / 0.18)",
          "border-gold":    "rgb(201 169 110 / 0.24)",
        },

        // Card
        card:               "rgb(15 15 17 / <alpha-value>)",
        "card-foreground":  "rgb(var(--aol-ink) / <alpha-value>)",

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

        // Convenience aliases
        softGold:        "rgb(var(--aol-gold)        / <alpha-value>)",
        gold:            "rgb(var(--aol-gold)        / <alpha-value>)",
        amber:           "rgb(var(--aol-gold-strong) / <alpha-value>)",
        cream:           "rgb(var(--aol-ink)         / <alpha-value>)",
        warmWhite:       "rgb(var(--aol-ink)         / <alpha-value>)",
        charcoal:        "rgb(var(--aol-bg-3)        / <alpha-value>)",
        "charcoal-light": "rgb(22 22 24              / <alpha-value>)",
        deepCharcoal:    "rgb(var(--aol-bg-2)        / <alpha-value>)",
        softBlack:       "rgb(var(--aol-bg)          / <alpha-value>)",
        obsidian:        "rgb(var(--aol-bg)          / <alpha-value>)",
        lightGrey:       "rgb(255 255 255 / 0.18)",
        forest:          "#0e3b33",
      },

      // ── SPACING (8px grid system for federated surfaces) ───────────────────
      spacing: {
        0: "0",
        1: "0.25rem",   // 4px
        2: "0.5rem",    // 8px
        3: "0.75rem",   // 12px
        4: "1rem",      // 16px
        5: "1.25rem",   // 20px
        6: "1.5rem",    // 24px
        8: "2rem",      // 32px
        10: "2.5rem",   // 40px
        12: "3rem",     // 48px
        16: "4rem",     // 64px
        20: "5rem",     // 80px
        24: "6rem",     // 96px
        32: "8rem",     // 128px
        40: "10rem",    // 160px
        48: "12rem",    // 192px
        56: "14rem",    // 224px
        64: "16rem",    // 256px
      },

      // ── TIMING ──────────────────────────────────────────────────────────────
      transitionDuration: {
        "400":   "400ms",
        "4000":  "4000ms",
        "10000": "10000ms",
      },
      transitionTimingFunction: {
        "in-expo": "cubic-bezier(0.95, 0.05, 0.795, 0.035)",
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
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
        "gold-radial":    "radial-gradient(circle at center, rgba(201,169,106,0.12) 0%, transparent 70%)",
        "premium-card":   "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        "gold-linear":    "linear-gradient(to right, transparent, rgba(201,169,106,0.34), transparent)",
        "aol-hairline":   "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)",
        "aol-hairline-gold": "linear-gradient(to right, transparent, rgba(201,169,106,0.34), transparent)",
        "terminal-core":  "radial-gradient(circle at 50% 0%, rgba(201,169,106,0.05), transparent 28%), linear-gradient(180deg, rgba(9,9,10,0.98), rgba(4,4,5,1))",
      },

      // ── BOX SHADOWS ─────────────────────────────────────────────────────────
      boxShadow: {
        premium:   "0 20px 40px -15px rgba(0,0,0,0.88)",
        card:      "0 24px 72px -30px rgba(0,0,0,0.84)",
        cardHover: "0 28px 84px -30px rgba(0,0,0,0.9), 0 0 32px rgba(201,169,106,0.05)",
        "gold-glow": "0 0 40px rgba(201,169,106,0.12)",
        terminal:  "0 28px 90px rgba(0,0,0,0.46), 0 1px 0 rgba(255,255,255,0.04) inset",
        "aol-panel": "0 32px 100px -50px rgba(0,0,0,0.98)",
        "aol-panel-gold": "0 32px 100px -50px rgba(0,0,0,0.98), 0 0 90px -35px rgba(201,169,106,0.18)",
      },

      // ── ANIMATION ───────────────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-gold": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
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