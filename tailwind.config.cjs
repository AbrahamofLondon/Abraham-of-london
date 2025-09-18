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
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // CSS-var tokens for flexibility (set in globals.css)
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "on-primary": "var(--color-on-primary)",
        "on-primary-hover": "var(--color-on-primary-hover)",
        secondary: "var(--color-secondary)",
        "on-secondary": "var(--color-on-secondary)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "on-accent": "var(--color-on-accent)",

        // Brand palette
        forest: "#0b2e1f",
        cream: "#fdfcf7",
        deepCharcoal: "#1a1a1a",
        lightGrey: "#e5e5e5",
        warmWhite: "#fafaf5",
        midGreen: "#4b8b6b",
        softGold: "#d4af37",
        midnight: "#0f3460",
        accentCrimson: "#e94560",

        // Extended gold scale
        gold: {
          DEFAULT: "#d4af37",
          50: "#f9f3da",
          100: "#f3e7b6",
          200: "#ead57a",
          300: "#e1c55b",
          400: "#d8b43b",
          500: "#d4af37",
          600: "#b89321",
          700: "#8f721a",
          800: "#735b14",
          900: "#58450f",
        },

        platinum: "#e5e4e2",
        // Override emerald
        emerald: { 700: "#047857" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"], // Geist / Inter
        serif: ["var(--font-serif)", "Georgia", "serif"],       // Playfair Display
        cursive: ["var(--font-cursive)", "cursive"],            // AbrahamofLondon signature
      },
      letterSpacing: {
        brand: "0.05em",
        widebrand: "0.1em",
      },
      boxShadow: {
        card: "0 10px 30px rgba(27, 67, 50, 0.10)",
        cardHover: "0 16px 42px rgba(27, 67, 50, 0.15)",
        header: "0 2px 8px rgba(0,0,0,0.05)",
        button: "0 4px 12px rgba(0,0,0,0.08)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        fadeIn: "fadeIn .6s ease both",
        fadeUp: "fadeUp .6s ease both",
        shimmer: "shimmer 3s linear infinite",
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": theme("colors.deepCharcoal"),
            "--tw-prose-headings": theme("colors.forest"),
            "--tw-prose-links": theme("colors.midGreen"),
            "--tw-prose-bullets": theme("colors.midGreen"),
            a: {
              textDecoration: "none",
              fontWeight: "500",
              "&:hover": { color: theme("colors.softGold") },
            },
            hr: { borderColor: theme("colors.lightGrey") },
          },
        },
        dark: {
          css: {
            "--tw-prose-body": theme("colors.cream"),
            "--tw-prose-headings": theme("colors.cream"),
            "--tw-prose-links": theme("colors.softGold"),
            "--tw-prose-bullets": theme("colors.midGreen"),
            hr: { borderColor: theme("colors.lightGrey") },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
