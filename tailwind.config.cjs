// tailwind.config.js - UPDATED
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        softGold: "#d6b26a",
        deepCharcoal: "#0b0d10",
        charcoal: "#15171c",
        forest: "#0e3b33",
        "aol-bg": "var(--aol-bg)",
        "aol-surface": "var(--aol-surface)",
        "aol-text": "var(--aol-text)",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
        serif: ["Georgia", "Cambria", '"Times New Roman"', "Times", "serif"],
      },
      boxShadow: {
        "soft-elevated": "0 10px 40px rgba(0, 0, 0, 0.3)",
        "glow-gold": "0 10px 40px rgba(214, 178, 106, 0.3)",
      },
      backgroundImage: {
        "luxury-diagonal":
          "radial-gradient(circle at top left, rgba(214, 178, 106, 0.22), transparent 55%), radial-gradient(circle at bottom right, rgba(14, 59, 51, 0.5), #050608)",
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: theme("colors.gray.900"),
            "p, li, em": { color: theme("colors.gray.900") },
            strong: { color: theme("colors.black"), fontWeight: 600 },
            "h1, h2, h3, h4": {
              color: theme("colors.black"),
              fontFamily: theme("fontFamily.serif").join(","),
            },
            a: {
              color: theme("colors.softGold"),
              textDecoration: "none",
              fontWeight: "500",
              "&:hover": {
                color: theme("colors.deepCharcoal"),
                textDecoration: "underline",
              },
            },
            blockquote: {
              color: theme("colors.gray.800"),
              borderLeftColor: theme("colors.softGold"),
              backgroundColor: theme("colors.gray.50"),
            },
            "ul > li::marker, ol > li::marker": {
              color: theme("colors.softGold"),
            },
            hr: { borderColor: theme("colors.gray.200") },
            "code, pre": {
              color: theme("colors.deepCharcoal"),
              backgroundColor: theme("colors.gray.100"),
            },
          },
        },
        invert: {
          css: {
            maxWidth: "none",
            "color, p, li, em": { color: theme("colors.slate.100") },
            strong: { color: theme("colors.white") },
            "h1, h2, h3, h4": {
              color: theme("colors.white"),
              fontFamily: theme("fontFamily.serif").join(","),
            },
            a: {
              color: theme("colors.softGold"),
              "&:hover": {
                color: theme("colors.amber.200"),
                textDecoration: "underline",
              },
            },
            blockquote: {
              color: theme("colors.slate.100"),
              borderLeftColor: theme("colors.softGold"),
              backgroundColor: "rgba(255, 255, 255, 0.05)",
            },
            "ul > li::marker, ol > li::marker": {
              color: theme("colors.softGold"),
            },
            hr: { borderColor: theme("colors.slate.700") },
            code: {
              color: theme("colors.softGold"),
              backgroundColor: "rgba(255, 255, 255, 0.08)",
            },
            pre: {
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              color: theme("colors.slate.100"),
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};