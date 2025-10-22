/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

module.exports = {
  // Enables dark mode based on the 'class' selector, necessary for Next-Themes
  darkMode: "class",
  
  // Configure files to scan for utility classes
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.css"
  ],
  
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", lg: "2rem", xl: "3rem", "2xl": "4rem" },
      screens: { "2xl": "1400px" }
    },
    
    extend: {
      colors: {
        // --- LUXURY PALETTE DEFINITIONS (Single Source of Truth) ---
        // Primary: Deep Forest Green (Rich, Classic)
        'deep-forest': '#0B2E1F',
        // Cream/Background: Warm Ivory (Luxury Paper Feel)
        'warm-cream': '#FAF7F2',
        // Accent: Muted Gold (Classic Opulence)
        'muted-gold': '#C5A352',
        // Text: Charcoal (Soft, highly readable black)
        'soft-charcoal': '#333333',
        // Supporting Colors
        'light-gray': '#E5E5E5',
        'subtle-green': '#4B8B6B', // Retained for bullets/links

        // --- CSS VARIABLE MAPPING (Necessary for dynamic theming) ---
        // These map to variables defined in your global CSS for light/dark mode switching.
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "on-primary": "var(--color-on-primary)",
        "on-primary-hover": "var(--color-on-primary-hover)",
        secondary: "var(--color-secondary)",
        "on-secondary": "var(--color-on-secondary)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "on-accent": "var(--color-on-accent)",

        // --- MISC ALIASES (Cleaned and retained only if absolutely necessary) ---
        // Removed: 'forest', 'deepCharcoal', 'cream', 'softGold', 'warmWhite', 'midGreen'
        // These are now replaced by their clear, single-source names above ('deep-forest', 'soft-charcoal', etc.)
        lightGrey: '#E5E5E5', // Duplicates 'light-gray', kept for existing code
        
        // Custom emerald shade override
        emerald: { ...colors.emerald, 700: "#047857" }
      },
      
      // Use new clear names for border/ring colors
      ringColor: { 'deep-forest': "var(--color-primary)" },
      borderColor: {
        'deep-forest': "var(--color-primary)",
        lightGrey: "#e5e5e5"
      },
      
      fontFamily: {
        // UPGRADE: Playfair Display for Serifs (Authority/Elegance)
        serif: ["var(--font-serif)", '"Playfair Display"', "Georgia", "serif"],
        // UPGRADE: Inter or a clean font for Sans (Modern Readability)
        sans: ["var(--font-sans)", '"Inter"', "system-ui", "sans-serif"],
        cursive: ["var(--font-cursive)", "cursive"]
      },
      
      typography: (theme) => ({
        DEFAULT: {
          css: {
            // Updated Prose Colors (using the new single-source names)
            "--tw-prose-body": theme("colors.soft-charcoal"),
            "--tw-prose-headings": theme("colors.deep-forest"),
            "--tw-prose-links": theme("colors.deep-forest"),
            "--tw-prose-bullets": theme("colors.subtle-green"),
            "--tw-prose-counters": theme("colors.subtle-green"),
            
            // Increased Paragraph Spacing for Luxury Readability
            p: { lineHeight: "1.85" },
            
            a: {
              textDecoration: "none",
              fontWeight: "500",
              transition: "color .15s ease",
              "&:hover": { color: theme("colors.muted-gold") } // Muted Gold hover
            },
            
            // Tighter, elegant heading spacing
            h1: {
              letterSpacing: "-0.015em",
              lineHeight: "1.1",
              marginBottom: "0.8rem", 
              fontFamily: theme("fontFamily.serif").join(", ") // Use Serif for Headings
            },
            h2: {
              letterSpacing: "-0.01em",
              lineHeight: "1.2",
              marginTop: "2.5rem", 
              marginBottom: "0.8rem",
              fontFamily: theme("fontFamily.serif").join(", ") // Use Serif for Subheadings
            },
            
            strong: { fontWeight: "700" }, // Bolder strong text
            
            blockquote: {
              borderLeftColor: theme("colors.muted-gold"), // Gold accent on quotes
              fontStyle: "italic",
              color: theme("colors.soft-charcoal")
            },
            
            hr: { borderColor: theme("colors.light-gray") }, // Use clear name
            ul: { paddingLeft: "1.5rem" }, 
            "ul > li::marker": { color: theme("colors.subtle-green") }
          }
        },
        invert: {
          css: {
            // Invert colors
            "--tw-prose-body": theme("colors.warm-cream"),
            "--tw-prose-headings": theme("colors.warm-cream"),
            "--tw-prose-links": theme("colors.muted-gold"),
            
            blockquote: {
              borderLeftColor: theme("colors.muted-gold"),
              color: theme("colors.warm-cream")
            }
          }
        }
      })
    }
  },
  
  plugins: [require("@tailwindcss/typography")]
};