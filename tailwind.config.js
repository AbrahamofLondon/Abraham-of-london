/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'luxury-black': '#0a0a0a',
        'luxury-gold': '#d4af37',
        'luxury-platinum': '#e5e4e2',
        'primary-900': '#111827',
      },
    },
  },
  plugins: [],
}