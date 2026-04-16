import React from 'react';
import { cn } from '@/lib/utils';
import type { SurfaceContract } from '@/lib/design-system/surfaces';

export interface CardShellProps {
  children: React.ReactNode;
  surface: SurfaceContract;
  variant?: 'default' | 'featured' | 'compact';
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CardShell: React.FC<CardShellProps> = ({
  children,
  surface,
  variant = 'default',
  interactive = false,
  className,
  onClick,
}) => {
  const densityClasses = {
    airy: 'p-8',
    balanced: 'p-6',
    compact: 'p-4',
  };

  const variantClasses = {
    default: 'rounded-lg',
    featured: 'rounded-xl shadow-[var(--ds-shadow-md)]',
    compact: 'rounded-md',
  };

  return (
    <article
      className={cn(
        'ds-panel transition-all',
        variantClasses[variant],
        densityClasses[surface.density],
        interactive && 'cursor-pointer hover:shadow-[var(--ds-shadow-lg)] hover:-translate-y-0.5',
        className
      )}
      style={{
        transitionDuration: 'var(--ds-duration-base)',
        transitionTimingFunction: 'var(--ds-ease-standard)',
      }}
      onClick={onClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </article>
  );
};
