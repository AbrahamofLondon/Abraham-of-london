// components/primitives/EnhancedCardShell.tsx
// Enhanced CardShell with slots for unified card architecture

import React from 'react';
import { cn } from '@/lib/utils';
import type { SurfaceContract } from '@/lib/design-system/surfaces';

export interface EnhancedCardShellProps {
  // Core props
  children: React.ReactNode;
  surface: SurfaceContract;
  
  // Layout variants
  variant?: 'default' | 'featured' | 'compact' | 'luxury';
  layout?: 'vertical' | 'horizontal' | 'cover-led';
  interactive?: boolean;
  
  // Visual styling
  className?: string;
  href?: string;
  onClick?: () => void;
  
  // Slot content (optional)
  cover?: React.ReactNode;
  badges?: React.ReactNode;
  metadata?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  excerpt?: React.ReactNode;
  footer?: React.ReactNode;
  tags?: React.ReactNode;
  cta?: React.ReactNode;
  
  // New slots for specific card types
  icon?: React.ReactNode; // For ContentCard icon
  progressBar?: React.ReactNode; // For BookCard progress
  authorSection?: React.ReactNode; // For BlogPostCard author display
}

export const EnhancedCardShell: React.FC<EnhancedCardShellProps> = ({
  children,
  surface,
  variant = 'default',
  layout = 'vertical',
  interactive = false,
  className,
  href,
  onClick,
  cover,
  badges,
  metadata,
  title,
  subtitle,
  excerpt,
  footer,
  tags,
  cta,
  icon,
  progressBar,
  authorSection,
}) => {
  // Density classes based on surface
  const densityClasses = {
    airy: 'p-8',
    balanced: 'p-6',
    compact: 'p-4',
  };

  // Variant styling using design system tokens
  const variantClasses = {
    default: 'rounded-lg border',
    featured: 'rounded-xl border shadow-[var(--ds-shadow-lg)]',
    compact: 'rounded-md border',
    luxury: 'rounded-2xl border shadow-[var(--ds-shadow-xl)]',
  };

  // Layout classes
  const layoutClasses = {
    vertical: 'flex flex-col',
    horizontal: 'flex flex-row gap-6',
    'cover-led': 'flex flex-col',
  };

  // Interactive states using design system tokens
  const interactiveClasses = interactive 
    ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[var(--ds-shadow-xl)] transition-all duration-300'
    : '';

  // Background based on surface tone using design system tokens
  const backgroundClasses = {
    institutional: 'bg-[var(--ds-panel)]',
    editorial: 'bg-[var(--ds-panel)]',
    technical: 'bg-[var(--ds-panel)]',
    restricted: 'bg-[var(--ds-panel-alt)]',
    kinetic: 'bg-[var(--ds-panel)]',
  };

  const Container = href ? 'a' : 'article';
  const containerProps = href ? { href } : {};

  const content = (
    <>
      {/* Cover section */}
      {cover && (
        <div className={cn(
          'relative overflow-hidden',
          layout === 'vertical' && 'mb-4',
          layout === 'horizontal' && 'w-1/3 flex-shrink-0',
          layout === 'cover-led' && 'mb-6'
        )}>
          {cover}
          {badges && (
            <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
              {badges}
            </div>
          )}
        </div>
      )}

      {/* Badges without cover */}
      {!cover && badges && (
        <div className="mb-4 flex flex-wrap gap-2">
          {badges}
        </div>
      )}

      {/* Content area */}
      <div className={cn(
        'flex flex-1 flex-col',
        layout === 'horizontal' && 'w-2/3'
      )}>
        {/* Metadata row */}
        {metadata && (
          <div className="mb-3 flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
            {metadata}
          </div>
        )}

        {/* Icon slot (for ContentCard) */}
        {icon && (
          <div className="mb-4">
            {icon}
          </div>
        )}

        {/* Title section */}
        {title && (
          <div className="mb-3">
            <div className="font-serif text-xl font-light text-[var(--ds-text)]">
              {title}
            </div>
            {subtitle && (
              <div className="mt-1 font-mono text-xs uppercase tracking-wider text-[var(--ds-text-muted)]">
                {subtitle}
              </div>
            )}
          </div>
        )}

        {/* Author section (for BlogPostCard) */}
        {authorSection && (
          <div className="mb-4">
            {authorSection}
          </div>
        )}

        {/* Excerpt */}
        {excerpt && (
          <div className="mb-4 flex-1">
            <div className="text-sm font-light leading-relaxed text-[var(--ds-text-body)]">
              {excerpt}
            </div>
          </div>
        )}

        {/* Progress bar slot (for BookCard) */}
        {progressBar && (
          <div className="mb-4">
            {progressBar}
          </div>
        )}

        {/* Tags */}
        {tags && (
          <div className="mb-4 flex flex-wrap gap-2">
            {tags}
          </div>
        )}

        {/* Footer area */}
        {(footer || cta) && (
          <div className="mt-auto flex items-center justify-between border-t border-[var(--ds-border)] pt-4">
            {footer && <div className="flex-1">{footer}</div>}
            {cta && <div className="flex-shrink-0">{cta}</div>}
          </div>
        )}

        {/* Custom children */}
        {children}
      </div>
    </>
  );

  return (
    <Container
      {...containerProps}
      className={cn(
        'group relative overflow-hidden backdrop-blur-sm',
        backgroundClasses[surface.tone],
        densityClasses[surface.density],
        variantClasses[variant],
        layoutClasses[layout],
        interactiveClasses,
        className
      )}
      onClick={onClick}
      role={onClick || href ? 'button' : 'article'}
      tabIndex={onClick || href ? 0 : undefined}
    >
      {/* Hover effects using design system tokens */}
      {interactive && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[var(--ds-accent)]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--ds-accent)] transition-all duration-300 group-hover:w-full" />
        </>
      )}
      
      {content}
    </Container>
  );
};

// Helper component for tags using design system tokens
export const CardTag: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <span className={cn(
    'rounded-full border bg-[var(--ds-panel-alt)] px-3 py-1 text-xs font-light backdrop-blur-sm',
    'border-[var(--ds-border)] text-[var(--ds-text-muted)]',
    'hover:border-[var(--ds-accent)]/30 hover:bg-[var(--ds-accent)]/10 hover:text-[var(--ds-accent)] transition-all duration-300',
    className
  )}>
    {children}
  </span>
);

// Helper component for badges using design system tokens
export const CardBadge: React.FC<{ 
  children: React.ReactNode; 
  variant?: 'default' | 'featured' | 'new' | 'locked';
  className?: string;
}> = ({ 
  children, 
  variant = 'default',
  className 
}) => {
  const variantStyles = {
    default: 'border bg-[var(--ds-panel-alt)] text-[var(--ds-text)]',
    featured: 'border bg-gradient-to-r from-[var(--ds-accent)]/20 to-[var(--ds-amber-400)]/20 text-[var(--ds-accent)]',
    new: 'border bg-[var(--ds-panel-alt)] text-[var(--ds-amber-400)]',
    locked: 'border bg-[var(--ds-accent)]/10 text-[var(--ds-accent)]',
  };

  const borderStyles = {
    default: 'border-[var(--ds-border)]',
    featured: 'border-[var(--ds-accent)]/40',
    new: 'border-[var(--ds-amber-400)]/50',
    locked: 'border-[var(--ds-accent)]/20',
  };

  return (
    <span className={cn(
      'rounded-full px-3 py-1 text-xs font-medium tracking-wider backdrop-blur-xl',
      variantStyles[variant],
      borderStyles[variant],
      className
    )}>
      {children}
    </span>
  );
};