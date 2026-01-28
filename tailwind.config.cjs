// tailwind.config.cjs - OPTIMIZED PRODUCTION VERSION
const fs = require("fs");
const path = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",

  content: (() => {
    const scanFile = path.join(__dirname, "tailwind.scan.txt");

    // Optional: log only when explicitly enabled
    const shouldLog = process.env.TAILWIND_SCAN_LOG === "1";

    try {
      if (fs.existsSync(scanFile)) {
        const patterns = fs
          .readFileSync(scanFile, "utf8")
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("#") && !l.startsWith("//"));

        if (shouldLog) {
          console.log(`[tailwind] scanning ${patterns.length} patterns from tailwind.scan.txt`);
        }
        return patterns;
      }
    } catch (e) {
      if (shouldLog) {
        console.warn("[tailwind] could not read tailwind.scan.txt; using fallback patterns");
      }
    }

    // Fallback patterns (match YOUR repo structure)
    return [
      "./pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
      "./content/**/*.{md,mdx}",

      // lib — whitelist only folders likely to contain Tailwind class strings
      "./lib/mdx/**/*.{js,ts,jsx,tsx}",
      "./lib/client/**/*.{js,ts,jsx,tsx}",
      "./lib/shared/**/*.{js,ts,jsx,tsx}",
      "./lib/downloads/**/*.{js,ts,jsx,tsx}",
      "./lib/resources/**/*.{js,ts,jsx,tsx}",
      "./lib/premium/**/*.{js,ts,jsx,tsx}",
    ];
  })(),

  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '3rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
    
    extend: {
      colors: {
        // CSS Custom Properties with fallbacks
        background: 'rgb(var(--color-background, 3 7 18) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground, 249 250 251) / <alpha-value>)',
        surface: 'rgb(var(--color-surface, 17 24 39) / <alpha-value>)',
        
        primary: {
          DEFAULT: 'rgb(var(--color-primary, 245 158 11) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light, 251 191 36) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark, 217 119 6) / <alpha-value>)',
        },
        
        secondary: 'rgb(var(--color-secondary, 107 114 128) / <alpha-value>)',
        muted: 'rgb(var(--color-muted, 75 85 99) / <alpha-value>)',
        accent: 'rgb(var(--color-accent, 139 92 246) / <alpha-value>)',
        destructive: 'rgb(var(--color-destructive, 239 68 68) / <alpha-value>)',
        success: 'rgb(var(--color-success, 34 197 94) / <alpha-value>)',
        
        border: 'rgb(var(--color-border, 55 65 81) / <alpha-value>)',
        ring: 'rgb(var(--color-ring, 245 158 11) / <alpha-value>)',
        
        // Semantic colors
        'soft-gold': 'rgb(var(--color-primary, 245 158 11) / <alpha-value>)',
      },
      
      fontFamily: {
        sans: ['var(--font-family-sans)'],
        mono: ['var(--font-family-mono)'],
        serif: ['var(--font-family-serif)'],
        editorial: ['var(--font-editorial)', 'serif'],
      },
      
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        '3xs': ['0.5rem', { lineHeight: '0.75rem' }],
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      
      boxShadow: {
        'soft': '0 2px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'elevation': '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'inner-strong': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.15)',
        'gold-glow': '0 0 25px rgba(245, 158, 11, 0.25)',
        'gold-glow-strong': '0 0 40px rgba(245, 158, 11, 0.4)',
      },
      
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-in',
      },
      
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
      },
      
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      
      opacity: {
        '15': '0.15',
        '85': '0.85',
      },
      
      backdropBlur: {
        'xs': '2px',
      },
      
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  
  plugins: [],
};