/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages//*.{js,ts,jsx,tsx,mdx}',
    './components//*.{js,ts,jsx,tsx,mdx}',
    './app//*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8f7f4',
          100: '#ede8df',
          200: '#ddd2c0',
          300: '#c8b497',
          400: '#b8966f',
          500: '#a67c52',
          600: '#8f6740',
          700: '#75533a',
          800: '#5e4635',
          900: '#4e3c31',
        },
        luxury: {
          gold: '#D4AF37',
          platinum: '#E5E4E2',
          black: '#1a1a1a',
          white: '#FEFEFE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.