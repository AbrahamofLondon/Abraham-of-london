/* tailwind.config.js - HARDENED INSTITUTIONAL VERSION (ENHANCED) */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
    // STRATEGIC FIX: Include the physical Contentlayer output to prevent purged styles
    "./.contentlayer/generated/**/*.{js,mjs}",
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      // Enhanced color palette
      colors: {
        // Primary brand colors
        gold: {
          50: '#fef9ec',
          100: '#fcf0d1',
          200: '#f9e0a3',
          300: '#f5cc6c',
          400: '#f0b23b',
          500: '#e89b1c',
          600: '#d6b26a', // Your softGold
          700: '#b48b3e',
          800: '#946f31',
          900: '#7a5a2b',
          950: '#463014',
        },
        // Institutional palette
        softGold: "#d6b26a",
        deepCharcoal: "#0b0d10",
        charcoal: "#15171c",
        forest: "#0e3b33",
        
        // Semantic colors using CSS variables
        "aol-bg": "var(--aol-bg)",
        "aol-surface": "var(--aol-surface)",
        "aol-text": "var(--aol-text)",
        "aol-muted": "var(--aol-muted)",
        "aol-border": "var(--aol-border-subtle)",
        
        // Extended color palette
        slate: {
          950: '#0b0d10',
        },
        amber: {
          450: '#d6b26a', // Match softGold
        },
      },
      
      // Enhanced font families
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        serif: [
          "Georgia",
          "Cambria",
          '"Times New Roman"',
          "Times",
          "serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },
      
      // Enhanced box shadows
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'elevated': '0 8px 24px rgba(0, 0, 0, 0.16)',
        'high': '0 12px 32px rgba(0, 0, 0, 0.2)',
        'xl': '0 16px 40px rgba(0, 0, 0, 0.24)',
        '2xl': '0 24px 48px rgba(0, 0, 0, 0.28)',
        
        // Your existing shadows
        "soft-elevated": "0 10px 40px rgba(0, 0, 0, 0.3)",
        "glow-gold": "0 10px 40px rgba(214, 178, 106, 0.3)",
        
        // New enhanced shadows
        "gold-glow": "0 0 20px rgba(214, 178, 106, 0.4)",
        "gold-glow-lg": "0 0 40px rgba(214, 178, 106, 0.6)",
        "inner-gold": "inset 0 2px 4px 0 rgba(214, 178, 106, 0.1)",
        "card-hover": "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(214, 178, 106, 0.1)",
      },
      
      // Enhanced background images
      backgroundImage: {
        // Your existing
        "luxury-diagonal":
          "radial-gradient(circle at top left, rgba(214, 178, 106, 0.22), transparent 55%), radial-gradient(circle at bottom right, rgba(14, 59, 51, 0.5), #050608)",
        
        // New gradients
        "gold-gradient": "linear-gradient(135deg, #d6b26a 0%, #e6c878 50%, #fff0b3 100%)",
        "gold-gradient-subtle": "linear-gradient(135deg, rgba(214, 178, 106, 0.1) 0%, rgba(214, 178, 106, 0.05) 100%)",
        "dark-gradient": "linear-gradient(to bottom, #0b0d10 0%, #050608 100%)",
        "surface-gradient": "linear-gradient(to bottom, var(--aol-surface) 0%, rgba(var(--aol-surface), 0.98) 100%)",
        "radial-gold": "radial-gradient(circle at 50% 0%, rgba(214, 178, 106, 0.2), transparent 70%)",
        "grid-pattern": "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
      },
      
      // Animation keyframes
      animation: {
        // Your global.css animations
        'shimmer': 'shimmer 2s infinite',
        'gentle-pulse': 'gentle-pulse 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
        'spin-slow': 'spin-slow 8s linear infinite',
        
        // New animations from enhanced global.css
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.4s ease-out forwards',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'skeleton-loading': 'skeleton-loading 1.5s infinite',
      },
      
      // Animation timing functions
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth-step': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      // Extended spacing scale
      spacing: {
        '128': '32rem',
        '144': '36rem',
        'screen-90': '90vh',
        'screen-80': '80vh',
      },
      
      // Extended borderRadius
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      
      // Extended opacity
      opacity: {
        '15': '0.15',
        '35': '0.35',
        '65': '0.65',
        '85': '0.85',
      },
      
      // Custom border widths
      borderWidth: {
        '3': '3px',
        '5': '5px',
        '6': '6px',
      },
      
      // Enhanced backdrop blur
      backdropBlur: {
        'xs': '2px',
      },
      
      // Enhanced typography plugin configuration
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: theme('colors.gray.900'),
            fontSize: '1.0625rem',
            lineHeight: '1.75',
            
            // Paragraphs and lists
            'p, li, em': { 
              color: theme('colors.gray.900'),
              lineHeight: '1.75',
              marginBottom: '1rem',
            },
            
            // Headings
            'h1, h2, h3, h4, h5, h6': {
              color: theme('colors.black'),
              fontFamily: theme('fontFamily.serif').join(','),
              fontWeight: '700',
              letterSpacing: '-0.025em',
              marginTop: '2em',
              marginBottom: '0.75em',
              scrollMarginTop: '2rem',
            },
            
            'h1': {
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              lineHeight: '1.2',
            },
            'h2': {
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            },
            'h3': {
              fontSize: 'clamp(1.5rem, 3vw, 1.875rem)',
            },
            
            // Strong text
            strong: { 
              color: theme('colors.black'), 
              fontWeight: '600' 
            },
            
            // Links
            a: {
              color: theme('colors.softGold'),
              textDecoration: 'none',
              fontWeight: '500',
              position: 'relative',
              padding: '0 2px',
              transition: 'color 0.2s ease',
              '&:hover': {
                color: theme('colors.deepCharcoal'),
                textDecoration: 'underline',
              },
            },
            
            // Blockquotes
            blockquote: {
              color: theme('colors.gray.800'),
              borderLeftColor: theme('colors.softGold'),
              borderLeftWidth: '4px',
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
              padding: '1rem 1rem 1rem 1.5rem',
              margin: '1.75rem 0',
              borderRadius: '0 1rem 1rem 0',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
              fontStyle: 'italic',
              transition: 'all 0.3s ease',
              'p': {
                margin: '0',
              },
            },
            
            // Lists
            'ul > li::marker, ol > li::marker': {
              color: theme('colors.softGold'),
            },
            'ul, ol': {
              paddingLeft: '1.5rem',
              margin: '1rem 0',
            },
            'li': {
              margin: '0.5rem 0',
            },
            
            // Horizontal rule
            hr: { 
              borderColor: theme('colors.gray.200'),
              margin: '2.5rem 0',
              borderWidth: '1px',
            },
            
            // Code blocks
            'code': {
              color: theme('colors.gray.900'),
              backgroundColor: 'rgba(148, 163, 184, 0.15)',
              borderRadius: '6px',
              padding: '0.15rem 0.4rem',
              fontSize: '0.85em',
              fontFamily: theme('fontFamily.mono').join(','),
            },
            'pre': {
              color: theme('colors.gray.900'),
              backgroundColor: 'rgba(148, 163, 184, 0.08)',
              borderRadius: '1.25rem',
              padding: '1rem 1.5rem',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)',
              overflowX: 'auto',
              margin: '1.5rem 0',
              'code': {
                backgroundColor: 'transparent',
                color: 'inherit',
                padding: '0',
                fontSize: '0.95em',
              },
            },
            
            // Tables
            'table': {
              width: '100%',
              borderCollapse: 'collapse',
              margin: '1.5rem 0',
            },
            'th, td': {
              border: `1px solid ${theme('colors.gray.200')}`,
              padding: '0.75rem',
              textAlign: 'left',
            },
            'th': {
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
              fontWeight: '600',
            },
          },
        },
        
        // Dark mode typography
        invert: {
          css: {
            maxWidth: 'none',
            color: theme('colors.slate.100'),
            fontSize: '1.0625rem',
            lineHeight: '1.75',
            
            // Paragraphs and lists
            'p, li, em': { 
              color: theme('colors.slate.100'),
              lineHeight: '1.75',
              marginBottom: '1rem',
            },
            
            // Headings
            'h1, h2, h3, h4, h5, h6': {
              color: theme('colors.white'),
              fontFamily: theme('fontFamily.serif').join(','),
              fontWeight: '700',
              letterSpacing: '-0.025em',
              marginTop: '2em',
              marginBottom: '0.75em',
              scrollMarginTop: '2rem',
            },
            
            'h1': {
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              lineHeight: '1.2',
            },
            'h2': {
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            },
            'h3': {
              fontSize: 'clamp(1.5rem, 3vw, 1.875rem)',
            },
            
            // Strong text
            strong: { 
              color: theme('colors.white') 
            },
            
            // Links
            a: {
              color: theme('colors.softGold'),
              textDecoration: 'none',
              fontWeight: '500',
              position: 'relative',
              padding: '0 2px',
              transition: 'color 0.2s ease',
              '&:hover': {
                color: theme('colors.amber.200'),
                textDecoration: 'underline',
              },
            },
            
            // Blockquotes
            blockquote: {
              color: theme('colors.slate.100'),
              borderLeftColor: theme('colors.softGold'),
              borderLeftWidth: '4px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              padding: '1rem 1rem 1rem 1.5rem',
              margin: '1.75rem 0',
              borderRadius: '0 1rem 1rem 0',
              boxShadow: '0 10px 26px rgba(0, 0, 0, 0.5)',
              fontStyle: 'italic',
              transition: 'all 0.3s ease',
              'p': {
                margin: '0',
              },
            },
            
            // Lists
            'ul > li::marker, ol > li::marker': {
              color: theme('colors.softGold'),
            },
            'ul, ol': {
              paddingLeft: '1.5rem',
              margin: '1rem 0',
            },
            'li': {
              margin: '0.5rem 0',
            },
            
            // Horizontal rule
            hr: { 
              borderColor: theme('colors.slate.700'),
              margin: '2.5rem 0',
              borderWidth: '1px',
            },
            
            // Code blocks
            'code': {
              color: theme('colors.softGold'),
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '6px',
              padding: '0.15rem 0.4rem',
              fontSize: '0.85em',
              fontFamily: theme('fontFamily.mono').join(','),
            },
            'pre': {
              color: theme('colors.slate.100'),
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              borderRadius: '1.25rem',
              padding: '1rem 1.5rem',
              boxShadow: '0 10px 28px rgba(0, 0, 0, 0.7)',
              overflowX: 'auto',
              margin: '1.5rem 0',
              position: 'relative',
              'code': {
                backgroundColor: 'transparent',
                color: 'inherit',
                padding: '0',
                fontSize: '0.95em',
              },
            },
            
            // Tables
            'table': {
              width: '100%',
              borderCollapse: 'collapse',
              margin: '1.5rem 0',
            },
            'th, td': {
              border: `1px solid ${theme('colors.slate.700')}`,
              padding: '0.75rem',
              textAlign: 'left',
            },
            'th': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              fontWeight: '600',
            },
          },
        },
        
        // Gold theme for prose
        gold: {
          css: {
            '--tw-prose-body': theme('colors.softGold'),
            '--tw-prose-headings': theme('colors.amber.200'),
            '--tw-prose-lead': theme('colors.amber.300'),
            '--tw-prose-links': theme('colors.softGold'),
            '--tw-prose-bold': theme('colors.amber.100'),
            '--tw-prose-counters': theme('colors.amber.400'),
            '--tw-prose-bullets': theme('colors.amber.400'),
            '--tw-prose-hr': theme('colors.amber.800'),
            '--tw-prose-quotes': theme('colors.amber.100'),
            '--tw-prose-quote-borders': theme('colors.amber.700'),
            '--tw-prose-captions': theme('colors.amber.400'),
            '--tw-prose-code': theme('colors.amber.100'),
            '--tw-prose-pre-code': theme('colors.amber.100'),
            '--tw-prose-pre-bg': 'rgba(0, 0, 0, 0.6)',
            '--tw-prose-th-borders': theme('colors.amber.700'),
            '--tw-prose-td-borders': theme('colors.amber.800'),
          },
        },
      }),
    },
  },
  
  // Plugins
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    function({ addUtilities }) {
      const newUtilities = {
        // Glass effect utilities
        '.glass': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
        
        // Text gradient utilities
        '.text-gradient-gold': {
          background: 'linear-gradient(135deg, #d6b26a 0%, #e6c878 50%, #fff0b3 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.text-gradient-gold-animated': {
          background: 'linear-gradient(90deg, #d6b26a 0%, #e6c878 25%, #fff0b3 50%, #e6c878 75%, #d6b26a 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'gradient-shift 3s linear infinite',
        },
        
        // Hide scrollbar but keep functionality
        '.hide-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        
        // Better line clamping
        '.line-clamp-1': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '1',
        },
        '.line-clamp-2': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '2',
        },
        '.line-clamp-3': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '3',
        },
        
        // Hardware acceleration
        '.gpu-accelerate': {
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          perspective: '1000',
        },
        
        // Better selection
        '.selection-gold *::selection': {
          backgroundColor: 'rgba(214, 178, 106, 0.35)',
          color: 'currentColor',
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    },
  ],
  
  // Safelist classes that might be dynamically generated
  safelist: [
    'text-gradient-gold',
    'glass',
    'glass-dark',
    'animate-float',
    'animate-pulse-glow',
    'animate-gradient-shift',
    'bg-grid-pattern',
    'bg-radial-gold',
    
    // Contentlayer might generate these
    'prose',
    'prose-invert',
    'prose-gold',
    'prose-lg',
    'prose-xl',
  ],
}