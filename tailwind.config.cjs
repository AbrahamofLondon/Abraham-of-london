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
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}