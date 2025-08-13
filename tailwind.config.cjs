/** @type {import('tailwindcss').Config} */
module.exports = {
  // IMPORTANT: Enable dark mode based on the 'dark' class
  darkMode: 'class',
  
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', lg: '2rem', xl: '3rem', '2xl': '4rem' },
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // We'll define these colors using CSS variables in globals.css
        // This is the key to dynamic dark/light mode theming
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'on-primary': 'var(--color-on-primary)',
        'on-primary-hover': 'var(--color-on-primary-hover)',
        secondary: 'var(--color-secondary)',
        'on-secondary': 'var(--color-on-secondary)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'on-accent': 'var(--color-on-accent)',
      },
      // Preserving all your existing settings below
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      letterSpacing: { brand: '0.05em', widebrand: '0.1em' },
      boxShadow: {
        card: '0 10px 30px rgba(27, 67, 50, 0.10)',
        cardHover: '0 16px 42px rgba(27, 67, 50, 0.15)',
        header: '0 2px 8px rgba(0,0,0,0.05)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: { fadeIn: 'fadeIn .6s ease both', fadeUp: 'fadeUp .6s ease both' },
      typography: ({ theme }) => ({
        // Using your existing typography settings, which are already perfect for a light/dark theme
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.deepCharcoal'),
            '--tw-prose-headings': theme('colors.forest'),
            '--tw-prose-links': theme('colors.forest'),
            '--tw-prose-bullets': theme('colors.midGreen'),
            a: { textDecoration: 'none', '&:hover': { color: theme('colors.softGold') } },
            hr: { borderColor: theme('colors.lightGrey') },
          },
        },
        invert: {
          css: {
            '--tw-prose-body': theme('colors.cream'),
            '--tw-prose-headings': theme('colors.cream'),
            '--tw-prose-links': theme('colors.softGold'),
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};