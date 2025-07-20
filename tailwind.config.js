// tailwind.config.js
module.exports = {
  content: [
    './pages//*.{js,ts,jsx,tsx}',
    './components//*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1B4332',      // Forest Green
        secondary: '#40916C',    // Mid Green
        gold: '#D4AF37',         // Soft Gold
        cream: '#F7F3E9',        // Cream
        charcoal: '#2D3436',     // Deep Charcoal
        warmWhite: '#FEFCF7',    // Warm White
        softGrey: '#DDD6C7',     // Light Grey
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.charcoal'),
            a: { color: theme('colors.primary'), textDecoration: 'underline' },
            h1: { color: theme('colors.primary') },
            h2: { color: theme('colors.primary') },
            h3: { color: theme('colors.primary') },
            strong: { color: theme('colors.primary') },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};