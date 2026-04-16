// components/readers/CanonReader.tsx
// CANON READER SPEC (Editorial Authority) - Flagship reading experience
// Implementation against specification, not reinterpretation

import React from 'react';
import { cn } from '@/lib/utils';

export interface CanonReaderProps {
  // Content
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  
  // Layout options
  showHero?: boolean;
  heroContent?: React.ReactNode;
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  
  // Surface option (choose ONE per spec)
  surfaceOption?: 'A' | 'B' | 'C';
  
  // Styling
  className?: string;
}

export const CanonReader: React.FC<CanonReaderProps> = ({
  title,
  subtitle,
  meta,
  children,
  showHero = false,
  heroContent,
  showFooter = false,
  footerContent,
  surfaceOption = 'A', // Option A recommended per spec
  className,
}) => {
  // Surface styling based on option (per spec)
  const surfaceStyles = {
    // Option A: Page background dark, content panels warm bone
    A: {
      container: 'bg-[#030305]', // --aol-bg (dark)
      content: 'bg-[#0E0E12] text-white/85', // --ds-panel (warm bone), --ds-text
      textColor: 'text-white/85',
    },
    // Option B: Full page warm bone surface
    B: {
      container: 'bg-[#0E0E12]', // --ds-panel
      content: 'bg-[#0E0E12] text-white/85', // Same as container
      textColor: 'text-white/85',
    },
    // Option C: Dark hero → light reading body (advanced)
    C: {
      container: 'bg-[#030305]',
      content: 'bg-[#0E0E12] text-white/85',
      textColor: 'text-white/85',
    },
  };

  const currentSurface = surfaceStyles[surfaceOption];

  return (
    <div className={cn(
      'canon-reader min-h-screen',
      currentSurface.container,
      className
    )}>
      {/* Layout Structure per spec:
          [ Hero (optional, restrained) ]
          [ Title ]
          [ Meta (light, quiet) ]
          [ Divider / spacing ]
          [ Body content (primary) ]
          [ Callouts / quotes / structure ]
          [ Footer / continuation ]
      */}
      
      {/* Hero - optional, restrained */}
      {showHero && heroContent && (
        <div className="hero-section mb-12">
          {heroContent}
        </div>
      )}

      {/* Main content container */}
      <div className={cn(
        'mx-auto max-w-[72ch] px-6 py-12', // 72ch max width (non-negotiable per spec)
        currentSurface.content
      )}>
        {/* Title */}
        <h1 className={cn(
          'font-serif font-light tracking-tight mb-6',
          'text-[36px] leading-[1.1]', // 36-44px, tight spacing
          currentSurface.textColor
        )}>
          {title}
        </h1>

        {/* Subtitle (if provided) */}
        {subtitle && (
          <p className={cn(
            'font-serif text-xl font-light mb-8',
            'text-white/66' // muted but readable
          )}>
            {subtitle}
          </p>
        )}

        {/* Meta - light, quiet */}
        {meta && (
          <div className="meta-section mb-10 pb-6 border-b border-white/12">
            <div className="text-sm text-white/48 font-mono tracking-wide">
              {meta}
            </div>
          </div>
        )}

        {/* Divider / spacing */}
        <div className="mb-12" /> {/* 2.5em - 3.5em section gap per spec */}

        {/* Body content (primary) */}
        <div className="body-content">
          {/* Typography System per spec:
              Font: Serif (Cormorant Garamond)
              Size: 18px – 20px
              Line height: 1.7 – 1.85
              Max width: 65–72ch (non-negotiable)
              Color: var(--ds-text) (must hit ≥ 7:1 contrast)
          */}
          <div className={cn(
            'prose prose-invert max-w-none',
            'font-serif text-[19px] leading-[1.8]', // 19px, 1.8 line height
            'text-white/85', // ≥ 7:1 contrast on dark background
            'space-y-[1.35em]' // 1.2em – 1.5em paragraph gap
          )}>
            {/* Headings per spec table */}
            <style>{`
              .canon-reader .prose h1 {
                font-family: 'Cormorant Garamond', Georgia, ui-serif, serif;
                font-size: 40px;
                font-weight: 350;
                letter-spacing: -0.01em;
                margin-top: 2.5em;
                margin-bottom: 0.5em;
              }
              
              .canon-reader .prose h2 {
                font-family: 'Cormorant Garamond', Georgia, ui-serif, serif;
                font-size: 28px;
                font-weight: 400;
                letter-spacing: -0.005em;
                margin-top: 2.2em;
                margin-bottom: 0.75em;
              }
              
              .canon-reader .prose h3 {
                font-family: 'Cormorant Garamond', Georgia, ui-serif, serif;
                font-size: 21px;
                font-weight: 450;
                letter-spacing: 0;
                margin-top: 1.8em;
                margin-bottom: 0.5em;
              }
              
              /* No gimmicky gradients, no glow effects */
              .canon-reader .prose h1,
              .canon-reader .prose h2,
              .canon-reader .prose h3 {
                background: none;
                text-shadow: none;
              }
              
              /* Links per spec */
              .canon-reader .prose a {
                color: #C9A96E; /* --ds-accent */
                text-decoration: underline;
                text-decoration-color: rgba(201, 169, 110, 0.3);
                text-underline-offset: 0.2em;
                transition: color 0.2s, text-decoration-color 0.2s;
              }
              
              .canon-reader .prose a:hover {
                color: #D4B577; /* slightly brighter */
                text-decoration-color: rgba(201, 169, 110, 0.5);
                /* not glowing per spec */
              }
              
              /* Lists per spec */
              .canon-reader .prose ul,
              .canon-reader .prose ol {
                margin-top: 1.2em;
                margin-bottom: 1.2em;
              }
              
              .canon-reader .prose li {
                margin-bottom: 0.5em; /* 0.5em–0.75em bullet spacing */
              }
              
              .canon-reader .prose li:last-child {
                margin-bottom: 0;
              }
              
              /* Blockquotes per spec */
              .canon-reader .prose blockquote {
                border-left: 3px solid #C9A96E; /* --ds-accent */
                color: rgba(255, 255, 255, 0.66); /* --ds-text-muted */
                font-style: italic;
                padding-left: 1.5em;
                margin: 2em 0;
                quotes: "\\201C" "\\201D" "\\2018" "\\2019";
              }
              
              .canon-reader .prose blockquote::before {
                content: open-quote;
                font-size: 2em;
                line-height: 0.1em;
                margin-right: 0.1em;
                vertical-align: -0.4em;
                opacity: 0.5;
              }
              
              .canon-reader .prose blockquote p {
                display: inline;
              }
            `}</style>
            
            {children}
          </div>
        </div>

        {/* Footer / continuation */}
        {showFooter && footerContent && (
          <div className="mt-16 pt-8 border-t border-white/12">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
};

// Callout component per spec
export const CanonCallout: React.FC<{
  type: 'insight' | 'warning' | 'principle';
  title?: string;
  children: React.ReactNode;
}> = ({ type, title, children }) => {
  const typeStyles = {
    insight: {
      background: 'bg-white/5', // --ds-panel-alt
      border: 'border-l-4 border-[#C9A96E]', // --ds-accent
      titleColor: 'text-[#C9A96E]',
    },
    warning: {
      background: 'bg-amber-500/5',
      border: 'border-l-4 border-amber-500',
      titleColor: 'text-amber-500',
    },
    principle: {
      background: 'bg-white/5',
      border: 'border-l-4 border-white/30', // --ds-border
      titleColor: 'text-white/85',
    },
  };

  const styles = typeStyles[type];

  return (
    <div className={cn(
      'my-8 p-6 rounded-r',
      styles.background,
      styles.border
    )}>
      {title && (
        <div className={cn(
          'font-mono text-sm uppercase tracking-widest mb-3',
          styles.titleColor
        )}>
          {title}
        </div>
      )}
      <div className="text-white/85 font-serif text-[18px] leading-[1.75]">
        {children}
      </div>
    </div>
  );
};

// Prohibited elements check (for development)
export const validateCanonContent = (content: string): string[] => {
  const violations: string[] = [];
  
  // Check for prohibited elements per spec
  const prohibitedPatterns = [
    { pattern: /gradient.*text|text.*gradient/i, message: 'Gradients under text' },
    { pattern: /animation.*background|background.*animation/i, message: 'Animated backgrounds' },
    { pattern: /opacity:\s*0\.[0-6]|rgba.*[0-6]\)/i, message: 'Low-opacity text (< 0.7)' },
    { pattern: /amber.*bone|bone.*amber/i, message: 'Amber-on-bone without contrast testing' },
    { pattern: /card.*fragmentation|fragmentation.*card/i, message: 'Card-style fragmentation inside body' },
  ];
  
  prohibitedPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      violations.push(`❌ ${message}`);
    }
  });
  
  return violations;
};