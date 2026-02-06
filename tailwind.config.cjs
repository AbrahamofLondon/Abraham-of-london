/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"], // Ensure class-based dark mode for the Vault UI

  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
    // Added .contentlayer to ensure generated files trigger the right utility classes
    "./.contentlayer/**/*.json", 
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
        },

        surface: "var(--brand-charcoal, #050505)",
        border: "rgba(255, 255, 255, 0.08)",
      },

      fontFamily: {
        sans: ["var(--font-family-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-family-mono)", "JetBrains Mono", "monospace"],
        serif: ["var(--font-family-serif)", "Cormorant Garamond", "serif"],
        editorial: ["var(--font-editorial)", "var(--font-family-serif)", "serif"],
      },

      fontSize: {
        "4xs": ["0.5rem", { lineHeight: "0.6rem", letterSpacing: "0.1em" }],
        "3xs": ["0.625rem", { lineHeight: "0.8rem", letterSpacing: "0.2em" }],
        "2xs": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.05em" }],
      },

      spacing: { 18: "4.5rem", 88: "22rem", 128: "32rem", 144: "36rem" },

      borderRadius: { "4xl": "2rem", "5xl": "2.5rem", "6xl": "3.5rem" },

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
        "shimmer-protocol": "protocol-shimmer 2s linear infinite",
      },

      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" },
        },
        "protocol-shimmer": {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },

      backdropBlur: { xs: "2px", "2xl": "40px" },
      zIndex: { 60: "60", 70: "70", 80: "80", 90: "90", 100: "100" },
    },
  },

  plugins: [
    require("@tailwindcss/typography"), 
    require("@tailwindcss/forms")
  ],
};