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
        // Luxury Color System
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

        // Semantic aliases
        forest: "#0B2E1F",
        charcoal: "#333333",
        cream: "#FAF7F2",
        gold: "#C5A352",

        // Supporting palette
        emerald: { ...colors.emerald, 700: "#047857" },
      },
      fontFamily: {
        serif: ["var(--font-serif)", '"Playfair Display"', "Georgia", "serif"],
        sans: ["var(--font-sans)", '"Inter"', "system-ui", "sans-serif"],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      opacity: {
        '15': '0.15',
      },
      transitionDuration: {
        '400': '400ms',
      },
      boxShadow: {
        'luxury': '0 4px 24px rgba(0, 0, 0, 0.08)',
        'luxury-hover': '0 8px 40px rgba(0, 0, 0, 0.12)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: theme('colors.on-secondary'),
            a: {
              color: theme('colors.primary'),
              textDecoration: 'none',
              borderBottom: `1px solid transparent`,
              transition: 'all 0.3s ease',
              '&:hover': {
                color: theme('colors.accent'),
                borderBottomColor: theme('colors.accent'),
              },
            },
            h1: {
              fontFamily: theme('fontFamily.serif').join(', '),
              fontWeight: '700',
              color: theme('colors.primary'),
            },
            h2: {
              fontFamily: theme('fontFamily.serif').join(', '),
              fontWeight: '700',
              color: theme('colors.primary'),
            },
            h3: {
              fontFamily: theme('fontFamily.serif').join(', '),
              fontWeight: '700',
              color: theme('colors.primary'),
            },
            blockquote: {
              borderLeftColor: theme('colors.accent'),
              fontStyle: 'italic',
              backgroundColor: theme('colors.accent / 0.05'),
              borderRadius: '0 6px 6px 0',
              padding: '1rem 1.5rem',
            },
            'blockquote p:first-of-type::before': {
              content: '""',
            },
            'blockquote p:last-of-type::after': {
              content: '""',
            },
          },
        },
      }),
    },
  },
  plugins: [],
};