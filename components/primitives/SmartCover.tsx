import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { SurfaceContract } from '@/lib/design-system/surfaces';

export interface SmartCoverProps {
  src: string;
  alt: string;
  aspect?: 'square' | 'portrait' | 'video' | 'wide';
  fit?: 'cover' | 'contain';
  position?: 'center' | 'top' | 'bottom';
  surface?: SurfaceContract;
  className?: string;
  priority?: boolean;
}

export const SmartCover: React.FC<SmartCoverProps> = ({
  src,
  alt,
  aspect = 'square',
  fit = 'cover',
  position = 'center',
  surface,
  className,
  priority = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    video: 'aspect-video',
    wide: 'aspect-[16/9]',
  };

  const positionClasses = {
    center: 'object-center',
    top: 'object-top',
    bottom: 'object-bottom',
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center ds-bg-muted',
          aspectClasses[aspect],
          className,
        )}
      >
        <span className="ds-text-subtle text-sm">{alt}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden ds-bg-muted',
        aspectClasses[aspect],
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          'transition-all',
          fit === 'cover' ? 'object-cover' : 'object-contain',
          positionClasses[position],
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
        )}
        style={{
          transitionDuration: 'var(--ds-duration-slow)',
          transitionTimingFunction: 'var(--ds-ease-entrance)',
        }}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      {!isLoaded && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background:
              'linear-gradient(90deg, var(--ds-background-muted), var(--ds-panel-alt), var(--ds-background-muted))',
          }}
        />
      )}
    </div>
  );
};
