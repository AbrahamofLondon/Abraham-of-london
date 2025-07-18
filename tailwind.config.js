/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // This covers files directly in pages/, components/, and app/
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // IMPORTANT: If your components/pages are inside a 'src' directory,
    // you need to include paths like these:
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
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
        // Also ensure these colors from your Navbar.tsx are defined, if not already:
        'deep-gold': '#b8860b', // Assuming a custom value
        'warm-gold': '#e2b42f', // Assuming a custom value
        'off-white': '#f5f5f5', // Assuming a custom value
        'neutral-dark': '#2c3e50', // Assuming a custom value
        'deep-navy': '#1a2a3a', // Assuming a custom value
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out', // Added closing quote and duration example
      },
      keyframes: { // You'll need keyframes if you define custom animations
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};