import React from 'react';
import { cn } from '@/lib/utils';
import type { SurfaceContract, SurfaceDensity } from '@/lib/design-system/surfaces';

export interface CardShellProps {
  children: React.ReactNode;
  /** Surface contract — provides density for padding */
  surface?: SurfaceContract;
  /** Override density without a full surface contract */
  density?: SurfaceDensity;
  variant?: 'default' | 'featured' | 'compact' | 'flush';
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  /** HTML element to render. Defaults to 'article'. Use 'div' inside motion wrappers. */
  as?: 'article' | 'div';
}

export const CardShell: React.FC<CardShellProps> = ({
  children,
  surface,
  density: densityOverride,
  variant = 'default',
  interactive = false,
  className,
  style,
  onClick,
  as: Element = 'article',
}) => {
  const density = densityOverride ?? surface?.density ?? 'balanced';

  const densityClasses = {
    airy: 'p-8',
    balanced: 'p-6',
    compact: 'p-4',
  };

  const variantClasses = {
    default: 'ds-panel rounded-lg',
    featured: 'ds-panel rounded-xl shadow-[var(--ds-shadow-md)]',
    compact: 'ds-panel rounded-md',
    flush: '', // no border, no radius, no panel — for grid layouts
  };

  return (
    <Element
      className={cn(
        'transition-all',
        variantClasses[variant],
        densityClasses[density],
        interactive && 'cursor-pointer hover:-translate-y-0.5',
        interactive && variant !== 'flush' && 'hover:shadow-[var(--ds-shadow-lg)]',
        className,
      )}
      style={{
        transitionDuration: 'var(--ds-duration-base)',
        transitionTimingFunction: 'var(--ds-ease-standard)',
        ...style,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </Element>
  );
};
