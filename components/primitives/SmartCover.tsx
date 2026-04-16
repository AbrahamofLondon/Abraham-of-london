// components/primitives/SmartCover.tsx
// Unified image cover component for cards

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getSafeImageProps, createFallbackSequence } from '@/lib/image-utils';
import type { FallbackConfig } from '@/lib/image-utils';

export interface SmartCoverProps {
  // Image source
  src?: string | null;
  alt: string;
  
  // Aspect ratio and sizing
  aspect?: 'square' | 'portrait' | 'landscape' | 'wide' | 'auto';
  fit?: 'cover' | 'contain' | 'smart';
  position?: string;
  
  // Fallback configuration
  fallbackConfig?: FallbackConfig;
  fallbackKey?: string; // For generating deterministic fallbacks
  
  // Loading behavior
  priority?: boolean;
  sizes?: string;
  
  // Styling
  className?: string;
  overlay?: boolean;
  scrim?: boolean;
  
  // Interactive
  hoverEffect?: boolean;
  
  // Children (for badges, etc.)
  children?: React.ReactNode;
}

export const SmartCover: React.FC<SmartCoverProps> = ({
  src,
  alt,
  aspect = 'landscape',
  fit = 'cover',
  position = 'center',
  fallbackConfig,
  fallbackKey,
  priority = false,
  sizes = '(max-width: 768px) 100vw, 33vw',
  className,
  overlay = true,
  scrim = true,
  hoverEffect = true,
  children,
}) => {
  // Aspect ratio classes
  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[16/10]',
    wide: 'aspect-[16/9]',
    auto: '',
  };

  // Object fit classes
  const fitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
    smart: 'object-cover',
  };

  // Generate fallback sequence if needed
  const fallbackSequence = useMemo(() => {
    if (!fallbackConfig || !fallbackKey) return [];
    return createFallbackSequence(fallbackKey, fallbackConfig);
  }, [fallbackConfig, fallbackKey]);

  const defaultFallbackSrc = '/assets/images/writing-desk.webp';
  const primarySrc = useMemo(() => (src && src.trim() ? src : defaultFallbackSrc), [src]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(primarySrc);
  const [fallbackIndex, setFallbackIndex] = useState(-1);

  // Reset when the primary source or fallback chain changes.
  useEffect(() => {
    setImageLoaded(false);
    setFallbackIndex(-1);
    setCurrentSrc(primarySrc);
  }, [primarySrc, fallbackSequence]);

  // Get safe image props
  const imageProps = useMemo(
    () =>
      getSafeImageProps(currentSrc, alt, {
        priority,
        fallbackConfig,
      }),
    [currentSrc, alt, priority, fallbackConfig],
  );

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Handle image error
  const handleImageError = useCallback(() => {
    setImageLoaded(false);
    const nextIndex = fallbackIndex + 1;

    if (nextIndex < fallbackSequence.length) {
      setFallbackIndex(nextIndex);
      setCurrentSrc(fallbackSequence[nextIndex] || defaultFallbackSrc);
      return;
    }

    if (currentSrc !== defaultFallbackSrc) {
      setFallbackIndex(fallbackSequence.length);
      setCurrentSrc(defaultFallbackSrc);
    }
  }, [currentSrc, fallbackIndex, fallbackSequence]);

  // Shimmer effect for loading
  const ShimmerEffect = () => (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50/80 to-gray-100 animate-pulse" />
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        style={{ animation: 'shimmer 2s infinite' }}
      />
    </div>
  );

  return (
    <div className={cn(
      'relative w-full overflow-hidden',
      aspectClasses[aspect],
      className
    )}>
      {/* Loading shimmer */}
      {!imageLoaded && <ShimmerEffect />}

      {/* Image */}
      <Image
        src={imageProps.src}
        alt={imageProps.alt}
        fill
        className={cn(
          fitClasses[fit],
          'transition-all duration-700',
          imageLoaded 
            ? 'opacity-100' 
            : 'opacity-0',
          hoverEffect && 'group-hover:scale-[1.03] group-hover:brightness-110'
        )}
        sizes={sizes}
        priority={imageProps.priority}
        loading={imageProps.loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ objectPosition: position }}
      />

      {/* Overlay gradient */}
      {overlay && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-transparent"
          aria-hidden="true"
        />
      )}

      {/* Scrim for text readability */}
      {scrim && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
          aria-hidden="true"
        />
      )}

      {/* Accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* Children (badges, etc.) */}
      {children && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative h-full w-full">
            {children}
          </div>
        </div>
      )}

      {/* Hover CTA (optional) */}
      {hoverEffect && (
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-all duration-700 group-hover:opacity-100 pointer-events-none">
          <div className="rounded-full border border-white/30 bg-black/60 backdrop-blur-xl px-6 py-3 transition-transform duration-500 group-hover:scale-105">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium tracking-wide text-white">
                Read Article
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for aspect ratio calculation
export function getAspectRatioClass(aspect: SmartCoverProps['aspect']): string {
  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[16/10]',
    wide: 'aspect-[16/9]',
    auto: '',
  } satisfies Record<NonNullable<SmartCoverProps['aspect']>, string>;

  return aspectClasses[aspect || 'landscape'] || '';
}

// Predefined aspect ratios for common use cases
export const COVER_ASPECTS = {
  BLOG: 'landscape' as const,
  BOOK: 'portrait' as const,
  CANON: 'portrait' as const,
  RESOURCE: 'landscape' as const,
  EVENT: 'wide' as const,
  PROFILE: 'square' as const,
};
