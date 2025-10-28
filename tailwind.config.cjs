/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

module.exports = {
  // Enables dark mode based on the 'class' selector, necessary for Next-Themes
  darkMode: "class",

  // Configure files to scan for utility classes
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.css",
  ],

  theme: {
    // --- Container Defaults ---
    container: {
      center: true,
      // Use responsive horizontal padding
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem", xl: "3rem" },
      // Max content width
      screens: { "2xl": "1440px" }, 
    },

    extend: {
      colors: {
        // --- 1. LUXURY PALETTE (Hex values used for non-dynamic colors or fallbacks) ---
        "deep-forest": "#0B2E1F",
        "warm-cream": "#FAF7F2",
        "muted-gold": "#C5A352",
        "soft-charcoal": "#333333",
        "light-gray": "#E5E5E5",
        "subtle-green": "#4B8B6B", 

        // --- 2. CSS VARIABLE MAPPING (Theme Dynamic Colors) ---
        // These keys map to the CSS variables defined in globals.css, ensuring they 
        // dynamically switch between light and dark modes.
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "on-primary": "var(--color-on-primary)",
        secondary: "var(--color-secondary)",
        "on-secondary": "var(--color-on-secondary)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "on-accent": "var(--color-on-accent)",
        
        // --- 3. ALIASES (Cleaned up) ---
        // Keep essential UI aliases that map to theme variables or constants
        "ui-border": "var(--color-lightGrey)",
        
        // Custom emerald shade override (if necessary, otherwise prefer the luxury palette)
        emerald: { ...colors.emerald, 700: "#047857" },
      },

      // --- Border/Ring Color Extensions ---
      ringColor: { 
        primary: "var(--color-primary)",
        accent: "var(--color-accent)", 
      },
      borderColor: {
        primary: "var(--color-primary)",
        "ui-border": "var(--color-lightGrey)",
      },

      // --- Font Family Extensions (Harmonizing with next/font/local) ---
      fontFamily: {
        // Use the explicit CSS variables defined by next/font/local (e.g., from lib/fonts/index.ts)
        serif: ["var(--font-family-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-family-sans)", "Inter", "system-ui", "sans-serif"],
        cursive: ["var(--font-family-cursive)", "Great Vibes", "cursive"],
      },

      // --- Tailwind Typography Plugin Customization ---
      typography: (theme) => ({
        DEFAULT: {
          css: {
            // Mapping prose colors to the dynamic theme variables (via `var()`)
            "--tw-prose-body": theme("colors.on-secondary"), // Text color from CSS variable
            "--tw-prose-headings": theme("colors.primary"), // Heading color from CSS variable
            "--tw-prose-links": theme("colors.primary"),
            "--tw-prose-bullets": theme("colors.accent"), // Use accent for bullets/markers
            "--tw-prose-counters": theme("colors.accent"),
            "--tw-prose-quote-borders": theme("colors.accent"),

            // Enhanced Typography
            p: { lineHeight: "1.85" },
            a: {
              textDecoration: "none",
              fontWeight: "500",
              transition: "color .15s ease",
              "&:hover": { color: theme("colors.accent-hover") }, // Use dynamic hover color
            },
            h1: {
              letterSpacing: "-0.015em",
              lineHeight: "1.1",
              marginBottom: "0.8rem",
              fontFamily: theme("fontFamily.serif").join(", "),
            },
            h2: {
              letterSpacing: "-0.01em",
              lineHeight: "1.2",
              marginTop: "2.5rem",
              marginBottom: "0.8rem",
              fontFamily: theme("fontFamily.serif").join(", "),
            },
            strong: { fontWeight: "700", color: theme("colors.primary") }, // Ensure strong is primary-colored

            blockquote: {
              borderLeftColor: theme("colors.accent"), 
              fontStyle: "italic",
              color: theme("colors.on-secondary"),
            },
            
            // Remove redundant list padding/marker color since it's set in globals.css
            ul: { paddingLeft: "1.5rem" }, 
          },
        },
        // --- Dark Mode / Invert Configuration ---
        invert: {
          css: {
            // These map to the DARK MODE CSS variables, ensuring the prose content
            // switches correctly when the 'dark' class is applied to HTML/body.
            "--tw-prose-body": theme("colors.on-secondary"),
            "--tw-prose-headings": theme("colors.primary"), 
            "--tw-prose-links": theme("colors.accent"),
            "--tw-prose-bullets": theme("colors.accent"),
            "--tw-prose-counters": theme("colors.accent"),
            "--tw-prose-quote-borders": theme("colors.accent"),
            
            blockquote: {
              borderLeftColor: theme("colors.accent"),
              color: theme("colors.on-secondary"),
            },
            
            strong: { color: theme("colors.on-secondary") }, // Strong text should be light in dark mode
          },
        },
      }),
    },
  },

  plugins: [
    require("@tailwindcss/typography"),
    // Add aspect ratio utility (highly recommended for modern layouts and images)
    require("@tailwindcss/aspect-ratio"),
  ],
};