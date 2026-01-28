// tailwind.config.cjs — Production clean, content-aware, font-var first
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",

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
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "3rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },

    extend: {
      colors: {
        background: "rgb(var(--color-background, 3 7 18) / <alpha-value>)",
        foreground:
          "rgb(var(--color-on-background, 249 250 251) / <alpha-value>)",
        surface: "rgb(var(--color-surface, 17 24 39) / <alpha-value>)",

        primary: {
          DEFAULT: "rgb(var(--color-primary, 245 158 11) / <alpha-value>)",
          light:
            "rgb(var(--color-primary-light, 251 191 36) / <alpha-value>)",

          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "rgb(var(--color-primary, 245 158 11) / <alpha-value>)",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },

        secondary: "rgb(var(--color-secondary, 107 114 128) / <alpha-value>)",
        accent: "rgb(var(--color-accent, 139 92 246) / <alpha-value>)",
        success: "rgb(var(--color-success, 34 197 94) / <alpha-value>)",
        error: "rgb(var(--color-error, 239 68 68) / <alpha-value>)",
        border: "rgb(var(--ui-alpha-border, 55 65 81) / <alpha-value>)",
      },

      fontFamily: {
        sans: [
          "var(--font-family-sans)",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["var(--font-family-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-family-serif)", "ui-serif", "serif"],
        editorial: [
          "var(--font-editorial)",
          "var(--font-family-serif)",
          "ui-serif",
          "serif",
        ],
      },

      fontSize: {
        "3xs": ["0.5rem", { lineHeight: "0.75rem" }],
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
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
      },

      boxShadow: {
        soft:
          "0 2px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        elevation:
          "0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "inner-strong": "inset 0 2px 4px 0 rgb(0 0 0 / 0.15)",
        "gold-glow": "0 0 25px rgba(245, 158, 11, 0.25)",
        "gold-glow-strong": "0 0 40px rgba(245, 158, 11, 0.4)",
      },

      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-out": "slide-out 0.3s ease-in",
      },

      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out": {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
      },

      backdropBlur: { xs: "2px" },

      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },
    },
  },

  plugins: [],
};