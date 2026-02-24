// tailwind.config.js — WORLD-CLASS (10/10) — FINAL, NO SILENT FAILS
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
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // ✅ future-proof
  ],

  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        sm: "2rem",
        lg: "4rem",
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
        background: "var(--brand-obsidian, #000000)",
        foreground: "var(--brand-cream, #fdfaf3)",
        surface: "var(--brand-charcoal, #050505)",

        ui: {
          background: "rgb(var(--color-background, 0 0 0) / <alpha-value>)",
          foreground: "rgb(var(--color-on-background, 253 250 243) / <alpha-value>)",
          surface: "rgb(var(--color-surface, 5 5 5) / <alpha-value>)",
          border: "rgb(var(--ui-alpha-border, 255 255 255) / <alpha-value>)",
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

        gold: {
          DEFAULT: "#D4AF37",
          glow: "rgba(212, 175, 55, 0.4)",
          50: "#fbf5e7",
          100: "#f7ebcf",
          200: "#efd79f",
          300: "#e7c36f",
          400: "#dfaf3f",
          500: "#D4AF37",
          600: "#b08f2c",
          700: "#8c6f21",
          800: "#684f16",
          900: "#44300b",
        },

        // ✅ Brand semantic alias (prevents “amber vs gold drift”)
        brand: {
          obsidian: "var(--brand-obsidian, #000000)",
          charcoal: "var(--brand-charcoal, #050505)",
          cream: "var(--brand-cream, #fdfaf3)",
          amber: "var(--brand-amber, #f59e0b)",
          gold: "var(--brand-gold, #d4af37)",
        },

        border: "rgba(255, 255, 255, 0.08)",
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
        editorial: [
          "var(--font-editorial)",
          "var(--font-family-serif)",
          "Cormorant Garamond",
          "Cormorant",
          "Garamond",
          "serif",
        ],
      },

      fontSize: {
        "4xs": ["0.5rem", { lineHeight: "0.6rem", letterSpacing: "0.12em" }],
        "3xs": ["0.625rem", { lineHeight: "0.8rem", letterSpacing: "0.2em" }],
        "2xs": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.05em" }],
      },

      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
        144: "36rem",
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3.5rem",
      },

      boxShadow: {
        soft: "0 2px 15px -3px rgb(0 0 0 / 0.1)",
        elevation: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
        "gold-glow": "0 0 25px rgba(245, 158, 11, 0.15)",
        "gold-glow-strong": "0 0 50px rgba(212, 175, 55, 0.25)",
        "inner-line": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)",
        premium: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
        card: "0 10px 30px -15px rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(255, 255, 255, 0.03) inset",
      },

      animation: {
        float: "float 8s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer-protocol": "protocol-shimmer 2s linear infinite",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-out": "slide-out 0.3s ease-in",
        "fade-in": "fade-in 0.5s ease-out",
        "scale-up": "scale-up 0.3s ease-out",
      },

      keyframes: {
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-15px)" } },
        "protocol-shimmer": { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        "slide-in": { "0%": { transform: "translateX(-100%)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        "slide-out": { "0%": { transform: "translateX(0)", opacity: "1" }, "100%": { transform: "translateX(100%)", opacity: "0" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "scale-up": { "0%": { transform: "scale(0.95)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },

      backdropBlur: { xs: "2px", "2xl": "40px" },

      zIndex: { 60: "60", 70: "70", 80: "80", 90: "90", 100: "100" },

      maxWidth: { "screen-safe": "100vw", "8xl": "1440px", "9xl": "1600px" },

      screens: { xs: "475px" },

      transitionTimingFunction: {
        institutional: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        premium: "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      transitionDuration: { 400: "400ms", 600: "600ms", 800: "800ms" },
    },
  },

  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/line-clamp"), // ✅ REQUIRED: you use line-clamp-*
  ],
};