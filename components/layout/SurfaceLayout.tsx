import React from 'react';
import { cn } from '@/lib/utils';
import { getSurface, SurfaceContract } from '@/lib/design-system/surfaces';

export interface SurfaceLayoutProps {
  children: React.ReactNode;
  surfaceId: string;
  title?: string;
  description?: string;
  className?: string;
}

export const SurfaceLayout: React.FC<SurfaceLayoutProps> = ({
  children,
  surfaceId,
  title,
  description,
  className,
}) => {
  const surface = getSurface(surfaceId);

  if (!surface) {
    return <div className={className}>{children}</div>;
  }

  const densityPadding = {
    airy: 'py-16',
    balanced: 'py-12',
    compact: 'py-8',
  };

  return (
    <div className={cn(`ds-surface-${surface.id}`, 'min-h-screen ds-bg', className)}>
      <main className={cn('container mx-auto px-6', densityPadding[surface.density])}>
        <div className="mb-12">
          <h1 className={cn(
            'text-4xl md:text-5xl font-bold tracking-tight ds-text',
            (surface.tone === 'editorial' || surface.tone === 'institutional') && 'font-serif',
            surface.tone === 'technical' && 'font-mono'
          )}>
            {title || surface.label}
          </h1>
          {description && (
            <p className="mt-4 ds-text-muted text-lg max-w-2xl">{description}</p>
          )}
        </div>
        {children}
      </main>
    </div>
  );
};