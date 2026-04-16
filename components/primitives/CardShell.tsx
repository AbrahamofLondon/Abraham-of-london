import React from 'react';
import { cn } from '@/lib/utils';
import { SurfaceContract } from '@/lib/design-system/surfaces';

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

  return (
    <article
      className={cn(
        'surface-aware-panel rounded-lg transition-all duration-200',
        densityClasses[surface.density],
        interactive && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </article>
  );
};