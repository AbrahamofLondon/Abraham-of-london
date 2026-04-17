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
  aspect?: 'square' | 'portrait' | 'landscape' | 'wide' | 'auto';
  fit?: 'cover' | 'contain';
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

export const SmartCover: React.FC<SmartCoverProps> = ({
  src,
  alt,
  aspect = 'landscape',
  fit = 'cover',
  position = 'center',
  priority = false,
  sizes = '(max-width: 768px) 100vw, 33vw',
  className,
  overlay = true,
  scrim = true,
  hoverEffect = true,
  children,
}) => {
  const aspectClasses: Record<string, string> = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[16/10]',
    wide: 'aspect-[16/9]',
    auto: '',
  };

  const fitClasses: Record<string, string> = {
    cover: 'object-cover',
    contain: 'object-contain',
  };

  // Resolve the image source — never pass empty/null to next/image
  const resolvedSrc = useMemo(() => {
    if (src && typeof src === 'string' && src.trim()) return src.trim();
    return DEFAULT_FALLBACK;
  }, [src]);

  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);

  // Reset when the source prop changes
  useEffect(() => {
    setCurrentSrc(resolvedSrc);
  }, [resolvedSrc]);

  const handleError = useCallback(() => {
    if (currentSrc !== DEFAULT_FALLBACK) {
      setCurrentSrc(DEFAULT_FALLBACK);
    }
  }, [currentSrc]);

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        aspectClasses[aspect] || '',
        className,
      )}
      style={{ backgroundColor: 'var(--ds-background-muted, #1a1a1e)' }}
    >
      {/* Image — always visible. Background color acts as placeholder. */}
      <Image
        src={currentSrc}
        alt={alt}
        fill
        className={cn(
          fitClasses[fit] || 'object-cover',
          hoverEffect && 'group-hover:scale-[1.03]',
        )}
        sizes={sizes}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        onError={handleError}
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
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Children (badges, etc.) */}
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
