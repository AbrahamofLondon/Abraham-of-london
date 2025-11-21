/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

module.exports = {
  darkMode: "class",
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
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        "2xl": "4rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // RESTORED Luxury Colors - these make existing classes work
        forest: "#0B2E1F",
        deepCharcoal: "#333333", 
        softGold: "#C5A352",
        warmCream: "#FAF7F2",
        charcoal: "#1F2937",

        // Theme variables for consistency
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "on-primary": "var(--color-on-primary)",
        
        secondary: "var(--color-secondary)",
        "on-secondary": "var(--color-on-secondary)",
        
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "on-accent": "var(--color-on-accent)",
        
        border: "var(--color-border)",
        surface: "var(--color-surface)",
        muted: "var(--color-muted)",

        // Supporting colors
        emerald: { ...colors.emerald, 700: "#047857" },
      },
      fontFamily: {
        // CORRECTED: Inter for body, Playfair for headings
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Playfair Display", "serif"],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        'luxury': '0 4px 24px rgba(0, 0, 0, 0.08)',
        'luxury-hover': '0 8px 40px rgba(0, 0, 0, 0.12)',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.on-secondary'),
            a: {
              color: theme('colors.primary'),
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.3s ease',
              '&:hover': {
                color: theme('colors.accent'),
              },
            },
            h1: {
              fontFamily: theme('fontFamily.serif').join(', '),
              fontWeight: '600',
              color: theme('colors.primary'),
            },
            h2: {
              fontFamily: theme('fontFamily.serif').join(', '),
              fontWeight: '600',
              color: theme('colors.primary'),
            },
            h3: {
              fontFamily: theme('fontFamily.serif').join(', '),
              fontWeight: '600',
              color: theme('colors.primary'),
            },
            h4: {
              fontFamily: theme('fontFamily.serif').join(', '),
              fontWeight: '600',
              color: theme('colors.primary'),
            },
            blockquote: {
              borderLeftColor: theme('colors.accent'),
              fontStyle: 'italic',
            },
            strong: {
              color: theme('colors.primary'),
              fontWeight: '600',
            },
            code: {
              color: theme('colors.primary'),
              fontWeight: '600',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
        invert: {
          css: {
            color: theme('colors.on-secondary'),
            a: {
              color: theme('colors.primary'),
              '&:hover': {
                color: theme('colors.accent'),
              },
            },
            h1: {
              color: theme('colors.primary'),
            },
            h2: {
              color: theme('colors.primary'),
            },
            h3: {
              color: theme('colors.primary'),
            },
            blockquote: {
              borderLeftColor: theme('colors.accent'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // RESTORED typography plugin
  ],
};