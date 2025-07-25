// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // The 'content' array tells Tailwind where to scan for utility classes.
  // It's crucial that this list includes ALL files where you use Tailwind classes,
  // including your Next.js pages, components, and your MDX content for both posts and books.
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // Scans all files in the 'pages' directory
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // Scans all files in the 'components' directory
    "./posts/**/*.mdx", // Crucial: Scans all MDX files within the 'posts' directory
    "./books/**/*.mdx", // Crucial: Scans all MDX files within the 'books' directory
    // If you add any other folders that contain files with Tailwind classes (e.g., 'lib', 'utils'),
    // you would need to add them here as well.
  ],
  theme: {
    extend: {
      // This is where you can extend Tailwind's default theme,
      // for example, by adding custom font families, colors, spacing, etc.
      fontFamily: {
        display: ['geist-black', 'sans-serif'], // Custom display font
        body: ['GeistMono-Regular', 'monospace'], // Custom body font
      },
      // You can add more extensions here, e.g.:
      // colors: {
      //   primary: '#FF0000',
      //   secondary: '#00FF00',
      // },
      // spacing: {
      //   '128': '32rem',
      // },
    },
  },
  // Plugins add new functionalities to Tailwind CSS.
  // @tailwindcss/typography is essential for styling markdown content with 'prose' classes.
  plugins: [
    require('@tailwindcss/typography'), // This line is critical for 'prose' classes to work
  ],
}