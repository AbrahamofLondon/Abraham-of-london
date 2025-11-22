// tailwind.config.ts
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";
import aspectRatio from "@tailwindcss/aspect-ratio";
import lineClamp from "@tailwindcss/line-clamp";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,jsx,ts,tsx,mdx}",
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core brand tones
        deepCharcoal: "#0B0D10",
        charcoal: "#15171C",
        softGold: "#D6B26A",
        gold: "#C89B3C",
        forest: "#0E3B33",
        emerald: "#2F6F4E",
        bone: "#F4F1EA",
        cloud: "#E5E7EB",

        // Status / accents
        error: "#B91C1C",
        success: "#15803D",
      },

      backgroundImage: {
        "luxury-radial":
          "radial-gradient(circle at top, rgba(214,178,106,0.22), transparent 55%), radial-gradient(circle at bottom, rgba(14,59,51,0.40), #050608)",
        "luxury-diagonal":
          "linear-gradient(135deg, #050608 0%, #15171C 45%, #0B0D10 100%)",
      },

      fontFamily: {
        // Wire these to your Next.js font variables if you’re using them
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        serif: ["var(--font-serif)", ...defaultTheme.fontFamily.serif],
        display: ["var(--font-display)", ...defaultTheme.fontFamily.serif],
      },

      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },

      boxShadow: {
        "soft-elevated":
          "0 18px 45px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02)",
        "glow-gold":
          "0 0 0 1px rgba(214,178,106,0.35), 0 26px 60px rgba(0,0,0,0.8)",
      },

      maxWidth: {
        "content-narrow": "46rem",
        "content-wide": "72rem",
      },

      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme("colors.gray.800"),
            maxWidth: "72ch",
            fontFamily: theme("fontFamily.sans").join(", "),
            a: {
              color: theme("colors.forest"),
              textDecoration: "none",
              fontWeight: "500",
              "&:hover": {
                color: theme("colors.softGold"),
                textDecoration: "underline",
              },
            },
            h1: {
              fontFamily: theme("fontFamily.display").join(", "),
              letterSpacing: "-0.04em",
              color: theme("colors.deepCharcoal"),
            },
            h2: {
              fontFamily: theme("fontFamily.display").join(", "),
              letterSpacing: "-0.03em",
              color: theme("colors.deepCharcoal"),
            },
            h3: {
              fontFamily: theme("fontFamily.display").join(", "),
              letterSpacing: "-0.01em",
              color: theme("colors.deepCharcoal"),
            },
            strong: {
              color: theme("colors.deepCharcoal"),
              fontWeight: "600",
            },
            blockquote: {
              fontStyle: "normal",
              borderLeftColor: theme("colors.softGold"),
              backgroundColor: theme("colors.bone"),
            },
            hr: {
              borderColor: "rgba(214,178,106,0.45)",
            },
            code: {
              backgroundColor: theme("colors.gray.100"),
              borderRadius: "999px",
              paddingInline: "0.45em",
              paddingBlock: "0.08em",
            },
          },
        },
        invert: {
          css: {
            color: theme("colors.gray.100"),
            a: {
              color: theme("colors.softGold"),
              "&:hover": {
                color: theme("colors.white"),
              },
            },
            h1: { color: theme("colors.white") },
            h2: { color: theme("colors.white") },
            h3: { color: theme("colors.softGold") },
            strong: { color: theme("colors.white") },
            blockquote: {
              borderLeftColor: theme("colors.softGold"),
              backgroundColor: "rgba(5,6,8,0.85)",
            },
            hr: {
              borderColor: "rgba(214,178,106,0.7)",
            },
            code: {
              backgroundColor: "rgba(15,23,42,0.9)",
            },
          },
        },
      }),
    },
  },
  plugins: [typography, forms, aspectRatio, lineClamp],
};

export default config;