/* tailwind.config.js - PRODUCTION READY */
/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "class",
  
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
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
        // Core colors mapped to your CSS variables
        background: 'var(--color-background)',
        foreground: 'var(--color-on-background)',
        
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
        },
        
        secondary: 'var(--color-secondary)',
        destructive: 'var(--color-error)',
        success: 'var(--color-success)',
        accent: 'var(--color-accent)',
        
        // Border colors
        border: 'var(--ui-alpha-border)',
        
        // Your brand tokens
        'aol-bg': 'var(--color-background)',
        'aol-surface': 'var(--color-surface)',
        'aol-text': 'var(--color-on-background)',
        'aol-muted': 'var(--color-secondary)',
        'aol-border': 'var(--ui-alpha-border)',
        'softGold': 'var(--color-primary)',
      },
      
      fontFamily: {
        sans: ['var(--font-family-sans)'],
        mono: ['var(--font-family-mono)'],
      },
      
      spacing: {
        'xs': 'var(--space-xs)',
        'sm': 'var(--space-sm)',
        'md': 'var(--space-md)',
        'lg': 'var(--space-lg)',
        'xl': 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
      },
      
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        'full': 'var(--radius-full)',
      },
      
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'gold': 'var(--shadow-gold)',
        'focus': 'var(--focus-ring)',
        'focus-strong': 'var(--focus-ring-strong)',
      },
      
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.4, 0, 0.2, 1)',
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
      
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
      },
    },
  },
  
  plugins: [],
}