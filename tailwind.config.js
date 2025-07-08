/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}', // Ensure this path matches your project
  ],
  theme: {
    extend: {
      colors: {
        'deep-navy': '#223843', // Primary brand color
        'warm-gold': '#D8B08C', // Gold variant 1
        'deep-gold': '#D4AF37', // Gold variant 2
        'off-white': '#FDF7F1', // Off-white variant 1
        'soft-white': '#FAF8F4', // Off-white variant 2
        'neutral-dark': '#121212',
        'neutral-light': '#EFEFEF',
        'charcoal': '#E0E0E0',
        // Keep your existing if they are different or map them to these new ones
        'luxury-black': '#1a1a1a',
        'luxury-gold': '#d4af37',
        'luxury-platinum': '#e5e4e2',
        'primary-900': '#151515',
      },
      fontFamily: {
        // Map the CSS variables to Tailwind utility classes
        serif: ['var(--font-heading)', 'serif'],
        sans: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    // Add any other plugins here if you have them
  ],
};