// components/readers/VaultReader.tsx
// VAULT READER SPEC (Technical Precision) - Structured intelligence
// Implementation against specification, not reinterpretation

import React from 'react';
import { cn } from '@/lib/utils';

export interface VaultReaderProps {
  // Content
  title: string;
  meta?: React.ReactNode;
  keyMetrics?: React.ReactNode;
  structuredSections?: Array<{
    title: string;
    content: React.ReactNode;
    id?: string;
  }>;
  supportingCommentary?: React.ReactNode;
  children?: React.ReactNode;
  
  // Layout
  showNavigation?: boolean;
  
  // Styling
  className?: string;
}

export const VaultReader: React.FC<VaultReaderProps> = ({
  title,
  meta,
  keyMetrics,
  structuredSections,
  supportingCommentary,
  children,
  showNavigation = false,
  className,
}) => {
  return (
    <div className={cn(
      'vault-reader min-h-screen',
      'bg-[#060609]', // dark steel --ds-background
      'text-white/94', // high contrast per spec
      className
    )}>
      {/* Layout Structure per spec:
          [ Title ]
          [ Meta (system-style) ]
          [ Key metrics / header info ]
          [ Structured sections ]
          [ Lists / tables / blocks ]
          [ Supporting commentary ]
      */}
      
      <div className="mx-auto max-w-[80ch] px-6 py-10"> // 70–80ch max width per spec
        {/* Title */}
        <h1 className={cn(
          'font-sans text-3xl font-semibold mb-6',
          'text-white/94' // high contrast
        )}>
          {title}
        </h1>

        {/* Meta - system-style */}
        {meta && (
          <div className="meta-section mb-8">
            <div className={cn(
              'font-mono text-[11px] uppercase tracking-[0.2em]',
              'text-white/66' // labels/metadata styling
            )}>
              {meta}
            </div>
          </div>
        )}

        {/* Key metrics / header info */}
        {keyMetrics && (
          <div className="key-metrics mb-10 p-6 bg-white/5 rounded-lg border border-white/10">
            {keyMetrics}
          </div>
        )}

        {/* Structured sections - modular, segmented, navigable */}
        {structuredSections && structuredSections.length > 0 ? (
          <div className="structured-sections space-y-12"> // 2.5em - 3.5em section gap
            {structuredSections.map((section, index) => (
              <section 
                key={section.id || `section-${index}`}
                id={section.id}
                className="structured-section"
              >
                {/* Section header with mono font per spec */}
                <h2 className={cn(
                  'font-mono text-sm uppercase tracking-widest mb-4',
                  'text-white/85',
                  'pb-2 border-b border-white/12'
                )}>
                  {section.title}
                </h2>
                
                {/* Section content */}
                <div className="section-content">
                  {/* Typography System per spec:
                      Font: Sans (Inter or system equivalent)
                      Size: 15px – 17px
                      Line height: 1.6 – 1.75
                  */}
                  <div className={cn(
                    'font-sans text-[16px] leading-[1.65]', // 16px, 1.65 line height
                    'text-white/94', // high contrast
                    'space-y-[1.2em]' // controlled spacing
                  )}>
                    {section.content}
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : (
          /* Fallback to children if no structured sections */
          <div className="body-content mt-8">
            <div className={cn(
              'font-sans text-[16px] leading-[1.65]',
              'text-white/94',
              'space-y-[1.2em]'
            )}>
              {children}
            </div>
          </div>
        )}

        {/* Supporting commentary */}
        {supportingCommentary && (
          <div className="supporting-commentary mt-12 pt-8 border-t border-white/12">
            <div className={cn(
              'font-sans text-[15px] leading-[1.6] italic',
              'text-white/75' // slightly muted for commentary
            )}>
              {supportingCommentary}
            </div>
          </div>
        )}
      </div>

      {/* Inline styles for spec compliance */}
      <style>{`
        /* Vault Reader global styles */
        .vault-reader {
          /* Prohibited per spec */
          background: #060609 !important; /* --ds-background */
        }
        
        /* Headings */
        .vault-reader h1 {
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          font-size: 28px;
          font-weight: 600;
          margin-top: 2em;
          margin-bottom: 0.75em;
        }
        
        .vault-reader h2 {
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          font-size: 20px;
          font-weight: 600;
          margin-top: 1.8em;
          margin-bottom: 0.5em;
        }
        
        .vault-reader h3 {
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          font-size: 16px;
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.25em;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        /* Prohibited in Vault per spec */
        .vault-reader h1,
        .vault-reader h2,
        .vault-reader h3 {
          font-family: Inter, ui-sans-serif, system-ui, sans-serif !important;
        }
        
        /* No serif body text */
        .vault-reader p,
        .vault-reader li,
        .vault-reader div:not(.font-mono) {
          font-family: Inter, ui-sans-serif, system-ui, sans-serif !important;
        }
        
        /* Links - subtle, functional */
        .vault-reader a {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: underline;
          text-decoration-color: rgba(255, 255, 255, 0.3);
          text-underline-offset: 0.15em;
        }
        
        .vault-reader a:hover {
          color: white;
          text-decoration-color: rgba(255, 255, 255, 0.5);
          /* No animation-heavy elements per spec */
        }
        
        /* Lists - primary tool per spec */
        .vault-reader ul,
        .vault-reader ol {
          margin-top: 1em;
          margin-bottom: 1em;
          padding-left: 1.5em;
        }
        
        .vault-reader li {
          margin-bottom: 0.4em;
        }
        
        .vault-reader li:last-child {
          margin-bottom: 0;
        }
        
        /* Bullet lists styling */
        .vault-reader ul {
          list-style-type: disc;
        }
        
        .vault-reader ul li::marker {
          color: rgba(255, 255, 255, 0.4);
        }
        
        /* Ordered lists for sequence */
        .vault-reader ol {
          list-style-type: decimal;
        }
        
        .vault-reader ol li::marker {
          color: rgba(255, 255, 255, 0.4);
          font-weight: 500;
        }
        
        /* Tables - allowed, clean, no borders overload */
        .vault-reader table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
        }
        
        .vault-reader th {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          text-align: left;
          padding: 0.75em 1em;
          border-bottom: 2px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.7);
        }
        
        .vault-reader td {
          padding: 0.75em 1em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .vault-reader tr:last-child td {
          border-bottom: none;
        }
        
        /* Code / Preformatted per spec */
        .vault-reader pre,
        .vault-reader code {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          background: rgba(255, 255, 255, 0.05); /* --ds-panel-alt */
          border-radius: 4px;
        }
        
        .vault-reader code {
          padding: 0.2em 0.4em;
          font-size: 14px;
        }
        
        .vault-reader pre {
          padding: 1.25em 1.5em;
          margin: 1.5em 0;
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .vault-reader pre code {
          background: none;
          padding: 0;
          font-size: 14px;
          /* No syntax-color chaos per spec */
          color: rgba(255, 255, 255, 0.9);
        }
        
        /* Callouts - minimal, functional, no editorial flourish */
        .vault-reader .callout {
          background: rgba(255, 255, 255, 0.04);
          border-left: 3px solid rgba(255, 255, 255, 0.2);
          padding: 1em 1.25em;
          margin: 1.5em 0;
          border-radius: 0 4px 4px 0;
        }
        
        .vault-reader .callout-title {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.5em;
          color: rgba(255, 255, 255, 0.7);
        }
        
        /* Blockquotes - restrained */
        .vault-reader blockquote {
          border-left: 2px solid rgba(255, 255, 255, 0.2);
          padding-left: 1.25em;
          margin: 1.5em 0;
          color: rgba(255, 255, 255, 0.75);
        }
        
        /* Horizontal rules for section separation */
        .vault-reader hr {
          border: none;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 2.5em 0;
        }
      `}</style>
    </div>
  );
};

// Vault-specific components per spec

export const VaultDataBlock: React.FC<{
  title: string;
  data: Array<{ label: string; value: string | number }>;
  compact?: boolean;
}> = ({ title, data, compact = false }) => {
  return (
    <div className="vault-data-block my-6">
      {title && (
        <div className="font-mono text-xs uppercase tracking-widest text-white/66 mb-3">
          {title}
        </div>
      )}
      <div className={cn(
        'bg-white/3 rounded border border-white/8',
        compact ? 'p-3' : 'p-4'
      )}>
        {data.map((item, index) => (
          <div 
            key={index}
            className={cn(
              'flex justify-between items-center',
              index < data.length - 1 ? 'mb-3 pb-3 border-b border-white/6' : ''
            )}
          >
            <div className="font-mono text-xs uppercase tracking-wider text-white/66">
              {item.label}
            </div>
            <div className="font-sans font-medium text-white/94">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const VaultCodeBlock: React.FC<{
  language?: string;
  children: string;
}> = ({ language, children }) => {
  return (
    <div className="my-6">
      {language && (
        <div className="font-mono text-xs uppercase tracking-widest text-white/50 mb-2">
          {language}
        </div>
      )}
      <pre className="bg-white/5 p-4 rounded border border-white/10 overflow-x-auto">
        <code className="font-mono text-sm text-white/90 whitespace-pre">
          {children}
        </code>
      </pre>
    </div>
  );
};

export const VaultCallout: React.FC<{
  type: 'note' | 'warning' | 'important';
  title?: string;
  children: React.ReactNode;
}> = ({ type, title, children }) => {
  const typeConfig = {
    note: {
      border: 'border-white/15',
      title: 'Note',
    },
    warning: {
      border: 'border-amber-500/30',
      title: 'Warning',
    },
    important: {
      border: 'border-white/25',
      title: 'Important',
    },
  };

  const config = typeConfig[type];

  return (
    <div className={cn(
      'my-6 p-4 rounded border-l-4',
      config.border,
      'bg-white/3'
    )}>
      {title && (
        <div className="font-mono text-xs uppercase tracking-widest text-white/70 mb-2">
          {title}
        </div>
      )}
      <div className="font-sans text-[15px] leading-[1.65] text-white/85">
        {children}
      </div>
    </div>
  );
};

// Validation for Vault compliance
export const validateVaultContent = (content: string): string[] => {
  const violations: string[] = [];
  
  const prohibitedPatterns = [
    { pattern: /font-family.*serif|Cormorant|Garamond/i, message: 'Serif body text' },
    { pattern: /gradient.*decorative|decorative.*gradient/i, message: 'Decorative gradients' },
    { pattern: /font-size:\s*[2-9][0-9]px|text-\[[3-9][0-9]/i, message: 'Oversized typography' },
    { pattern: /hero.*cinematic|cinematic.*hero/i, message: 'Cinematic hero interference' },
    { pattern: /card.*fragmentation.*reading|reading.*flow.*card/i, message: 'Card-heavy fragmentation in reading flow' },
  ];
  
  prohibitedPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      violations.push(`❌ VAULT VIOLATION: ${message}`);
    }
  });
  
  return violations;
};