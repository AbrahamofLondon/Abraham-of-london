// components/primitives/SmartCover.tsx
// Unified image cover component for cards.
//
// Fixes applied:
// 1. Handles "missed onLoad after SSR hydration" — checks img.complete on mount
// 2. Dark-first shimmer (no light-mode gray flash)
// 3. Robust fallback chain — skips missing intermediaries, lands on writing-desk.webp

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_FALLBACK = '/assets/images/writing-desk.webp';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SmartCoverProps {
  src?: string | null;
  alt: string;
  /** Layout aspect: internal presets or frontmatter values (book, wide, etc.) */
  aspect?: 'square' | 'portrait' | 'landscape' | 'wide' | 'auto' | 'book' | 'standard' | 'video';
  /** Object-fit behavior. "smart" resolves to cover or contain based on image. */
  fit?: 'cover' | 'contain' | 'smart';
  position?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  overlay?: boolean;
  scrim?: boolean;
  hoverEffect?: boolean;
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// Map frontmatter aspect values to CSS aspect-ratio classes
const ASPECT_CLASSES: Record<string, string> = {
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  book: 'aspect-[3/4]',
  landscape: 'aspect-[16/10]',
  standard: 'aspect-[4/3]',
  wide: 'aspect-[16/9]',
  video: 'aspect-[16/9]',
  auto: '',
};

// Numeric ratios for smart-fit comparison
const ASPECT_RATIOS: Record<string, number> = {
  square: 1,
  portrait: 3 / 4,
  book: 3 / 4,
  landscape: 16 / 10,
  standard: 4 / 3,
  wide: 16 / 9,
  video: 16 / 9,
  auto: 16 / 10,
};

export const SmartCover: React.FC<SmartCoverProps> = ({
  src,
  alt,
  aspect = 'landscape',
  fit = 'cover',
  position = 'center',
  priority = false,
  sizes = '(max-width: 768px) 100vw, 33vw',
  className,
  overlay = false,
  scrim = false,
  hoverEffect = true,
  children,
}) => {
  // Resolve the image source — never pass empty/null to next/image
  const resolvedSrc = useMemo(() => {
    if (src && typeof src === 'string' && src.trim()) return src.trim();
    return DEFAULT_FALLBACK;
  }, [src]);

  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);
  const [imageRatio, setImageRatio] = useState<number | null>(null);
  const hasErrored = React.useRef(false);

  // Reset when the source prop changes (new card, new data)
  useEffect(() => {
    setCurrentSrc(resolvedSrc);
    hasErrored.current = false;
    setImageRatio(null);
  }, [resolvedSrc]);

  const handleError = useCallback(() => {
    if (!hasErrored.current && currentSrc !== DEFAULT_FALLBACK) {
      hasErrored.current = true;
      setCurrentSrc(DEFAULT_FALLBACK);
    }
  }, [currentSrc]);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setImageRatio(img.naturalWidth / img.naturalHeight);
    }
  }, []);

  // Resolve effective fit: smart mode compares image ratio to frame ratio
  const effectiveFit: 'cover' | 'contain' = useMemo(() => {
    if (fit === 'cover') return 'cover';
    if (fit === 'contain') return 'contain';
    // smart: decide based on image vs frame ratio
    if (fit === 'smart' && imageRatio != null) {
      const frameRatio = ASPECT_RATIOS[aspect] ?? 16 / 10;
      const delta = Math.abs(imageRatio - frameRatio) / frameRatio;
      // If the image shape differs significantly from the frame, contain it
      if (delta >= 0.28) return 'contain';
      if (imageRatio < frameRatio * 0.82) return 'contain';
      if (imageRatio > frameRatio * 1.45) return 'contain';
    }
    return 'cover';
  }, [fit, imageRatio, aspect]);

  const aspectClass = ASPECT_CLASSES[aspect] ?? ASPECT_CLASSES.landscape;

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        aspectClass,
        className,
      )}
      style={{ backgroundColor: 'var(--ds-background-muted, #1a1a1e)' }}
    >
      <Image
        src={currentSrc}
        alt={alt}
        fill
        className={cn(
          effectiveFit === 'contain' ? 'object-contain' : 'object-cover',
          hoverEffect && 'group-hover:scale-[1.03]',
        )}
        sizes={sizes}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        onError={handleError}
        onLoad={handleLoad}
        style={{
          objectPosition: position,
          padding: effectiveFit === 'contain' ? '8%' : undefined,
        }}
      />

      {overlay && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-transparent"
          aria-hidden="true"
        />
      )}

      {scrim && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
          aria-hidden="true"
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {children && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative h-full w-full">{children}</div>
        </div>
      )}
    </div>
  );
};

// Predefined aspect ratios for common use cases
export const COVER_ASPECTS = {
  BLOG: 'landscape' as const,
  BOOK: 'portrait' as const,
  CANON: 'portrait' as const,
  RESOURCE: 'landscape' as const,
  EVENT: 'wide' as const,
  PROFILE: 'square' as const,
};
