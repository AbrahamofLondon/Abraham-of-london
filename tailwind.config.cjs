// tailwind.config.js - FIXED WITH ALL DIRECTORIES
/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "class",
  
  content: [
    // Include ALL possible file locations
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // If using src directory
  ],

  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
    },
    
    extend: {
      colors: {
        // Base colors with proper fallbacks
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
        },
        
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        destructive: 'rgb(var(--color-error) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        
        // Grayscale for better visibility
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        
        // Your brand colors with opacity support
        'aol-bg': 'rgb(var(--color-background) / <alpha-value>)',
        'aol-surface': 'rgb(var(--color-surface) / <alpha-value>)',
        'aol-text': 'rgb(var(--color-on-background) / <alpha-value>)',
        'aol-muted': 'rgb(var(--color-secondary) / <alpha-value>)',
        'aol-border': 'rgb(var(--ui-alpha-border) / <alpha-value>)',
        'softGold': 'rgb(var(--color-primary) / <alpha-value>)',
        
        // Amber palette (for your gold theme)
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
      },
      
      fontFamily: {
        sans: ['var(--font-family-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-family-mono)', 'monospace'],
        serif: ['var(--font-family-serif)', 'Georgia', 'serif'],
      },
      
      spacing: {
        'xs': '0.5rem',
        'sm': '1rem',
        'md': '1.5rem',
        'lg': '2rem',
        'xl': '3rem',
        '2xl': '4rem',
        '3xl': '6rem',
      },
      
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        'full': '9999px',
      },
      
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        'gold': '0 0 20px rgba(245, 158, 11, 0.3)',
        'focus': '0 0 0 3px rgba(245, 158, 11, 0.5)',
        'focus-strong': '0 0 0 3px rgba(245, 158, 11, 0.8)',
      },
      
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  
  plugins: [],
}