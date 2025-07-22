// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A202C',
        secondary: '#EDF2F7',
        accent: '#4FD1C5',
        cream: '#F7FAFC',
        softGrey: '#A0AEC0',
        charcoal: '#2D3748',
        warmWhite: '#F8F8F8',
        gold: '#FFD700',
      },
      fontFamily: {
        // IMPORTANT: These names ('geist-black', 'GeistMono-Regular')
        // must EXACTLY match the font-family names defined in your @font-face rules below.
        display: ['geist-black', 'sans-serif'], // Use 'geist-black' for font-display
        body: ['GeistMono-Regular', 'monospace'], // Use 'GeistMono-Regular' for font-body
        // Add more if you have other weights/styles of Geist or other fonts
      },
    },
  },
  plugins: [],
};