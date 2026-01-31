/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",

  // Broad content awareness for deep-nested intelligence assets
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
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
        "2xl": "1440px", // Institutional standard width
      },
    },

    extend: {
      colors: {
        // Core Palette mapped to Brand CSS Variables
        background: "rgb(var(--brand-obsidian, 0 0 0) / <alpha-value>)",
        foreground: "rgb(var(--brand-cream, 253 250 243) / <alpha-value>)",
        
        primary: {
          DEFAULT: "#f59e0b", // Amber 500
          light: "#fbbf24",   // Amber 400
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

        // Tactical brand mapping
        gold: {
          DEFAULT: "#D4AF37",
          glow: "rgba(212, 175, 55, 0.4)",
        },

        surface: "rgb(var(--brand-charcoal, 5 5 5) / <alpha-value>)",
        border: "rgba(255, 255, 255, 0.08)",
      },

      fontFamily: {
        // Variable-first font stacks
        sans: [
          "var(--font-family-sans, 'Inter')",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "var(--font-family-mono, 'JetBrains Mono')",
          "ui-monospace",
          "monospace",
        ],
        serif: [
          "var(--font-family-serif, 'Cormorant Garamond')",
          "ui-serif",
          "serif",
        ],
        editorial: [
          "var(--font-editorial)",
          "var(--font-family-serif)",
          "ui-serif",
        ],
      },

      fontSize: {
        // Monastic small-caps scale
        "4xs": ["0.5rem", { lineHeight: "0.6rem", letterSpacing: "0.1em" }],
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
      },

      animation: {
        float: "float 8s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer-protocol": "shimmer 2.5s linear infinite",
        "reveal-text": "reveal 1.2s cubic-bezier(0.77, 0, 0.175, 1) forwards",
      },

      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        reveal: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },

      backdropBlur: {
        xs: "2px",
        "2xl": "40px",
      },

      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },
    },
  },

  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    // Add additional tactical plugins here
  ],
};