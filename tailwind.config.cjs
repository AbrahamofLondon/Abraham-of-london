/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        softGold: "#d6b26a",
        deepCharcoal: "#0b0d10",
        charcoal: "#15171c",
        forest: "#0e3b33",
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
      // Global typography tuned for DARK backgrounds.
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: theme("colors.slate.100"),

            p: {
              color: theme("colors.slate.100"),
            },
            li: {
              color: theme("colors.slate.100"),
            },
            strong: {
              color: theme("colors.slate.50"),
            },
            em: {
              color: theme("colors.slate.100"),
            },

            h1: {
              color: theme("colors.white"),
              fontFamily: theme("fontFamily.serif").join(","),
            },
            h2: {
              color: theme("colors.slate.50"),
              fontFamily: theme("fontFamily.serif").join(","),
            },
            h3: {
              color: theme("colors.slate.50"),
              fontFamily: theme("fontFamily.serif").join(","),
            },
            h4: {
              color: theme("colors.slate.50"),
              fontFamily: theme("fontFamily.serif").join(","),
            },

            a: {
              color: theme("colors.softGold"),
              textDecoration: "none",
              fontWeight: "500",
              "&:hover": {
                color: theme("colors.amber.200"),
                textDecoration: "underline",
              },
            },

            blockquote: {
              color: theme("colors.slate.100"),
              borderLeftColor: theme("colors.softGold"),
              backgroundColor: "rgba(255, 255, 255, 0.03)",
            },

            "ul > li::marker, ol > li::marker": {
              color: theme("colors.softGold"),
            },

            hr: {
              borderColor: theme("colors.slate.700"),
            },

            code: {
              color: theme("colors.softGold"),
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },

            pre: {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: theme("colors.slate.100"),
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};