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
        // Understated Color System
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

        // Semantic aliases - minimal
        charcoal: "#1a1a1a",
        bronze: "#8b7355",

        // Supporting neutrals
        gray: colors.gray,
      },
      fontFamily: {
        serif: ["var(--font-serif)", '"Playfair Display"', "Georgia", "serif"],
        sans: ["var(--font-serif)", '"Inter"', "system-ui", "sans-serif"],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      opacity: {
        '8': '0.08',
      },
      transitionDuration: {
        '400': '400ms',
      },
      boxShadow: {
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '0.5rem',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: '65ch',
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
            blockquote: {
              borderLeftColor: theme('colors.border'),
              fontStyle: 'normal',
              backgroundColor: theme('colors.border / 0.03'),
              padding: '1rem 1.5rem',
            },
            strong: {
              color: theme('colors.primary'),
              fontWeight: '600',
            },
          },
        },
      }),
    },
  },
  plugins: [],
};