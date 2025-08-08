/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./posts/**/*.mdx",
    "./books/**/*.mdx",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Geist Black"', 'sans-serif'], // Optional headline font
        sans: ['"Geist Mono"', 'monospace'],      // Body font
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
