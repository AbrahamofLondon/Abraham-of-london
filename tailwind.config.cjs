/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        softGold: '#d6b26a',
        deepCharcoal: '#0b0d10',
        charcoal: '#15171c',
        forest: '#0e3b33',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
      boxShadow: {
        'soft-elevated': '0 10px 40px rgba(0, 0, 0, 0.3)',
        'glow-gold': '0 10px 40px rgba(214, 178, 106, 0.3)',
      },
      backgroundImage: {
        'luxury-diagonal': 'radial-gradient(circle at top left, rgba(214, 178, 106, 0.22), transparent 55%), radial-gradient(circle at bottom right, rgba(14, 59, 51, 0.5), #050608)',
      },
      typography: (theme) => ({
  DEFAULT: {
    css: {
      maxWidth: 'none',
      color: theme('colors.gray.800'),
      a: {
        color: theme('colors.forest'),
        textDecoration: 'none',
        '&:hover': {
          color: theme('colors.softGold'),
          textDecoration: 'underline',
        },
      },
    },
  },
  invert: {
    css: {
      '--tw-prose-body': theme('colors.gray.200'),
      '--tw-prose-headings': '#ffffff',
      '--tw-prose-lead': theme('colors.gray.300'),
      '--tw-prose-links': theme('colors.softGold'),
      '--tw-prose-bold': '#f9fafb',
      '--tw-prose-counters': theme('colors.gray.400'),
      '--tw-prose-bullets': theme('colors.softGold'),
      '--tw-prose-hr': theme('colors.gray.700'),
      '--tw-prose-quotes': theme('colors.gray.100'),
      '--tw-prose-quote-borders': theme('colors.softGold'),
      '--tw-prose-captions': theme('colors.gray.400'),
      '--tw-prose-code': theme('colors.softGold'),
      '--tw-prose-pre-code': theme('colors.gray.100'),
      '--tw-prose-pre-bg': '#020617',
      '--tw-prose-th-borders': theme('colors.gray.600'),
      '--tw-prose-td-borders': theme('colors.gray.700'),
      color: theme('colors.gray.200'),
      a: {
        color: theme('colors.softGold'),
        textDecoration: 'none',
        '&:hover': {
          color: '#ffffff',
          textDecoration: 'underline',
        },
      },
    },
  },
}),
  plugins: [
    require('@tailwindcss/typography'),
  ],
}