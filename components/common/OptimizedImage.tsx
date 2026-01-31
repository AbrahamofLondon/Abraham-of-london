import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';

interface OptimizedImageProps extends ImageProps {
  optimizedPath?: string;
  fallbackPath: string;
}

/**
 * Abraham of London - Strategic Image Component
 * Handles the gap between CI-skipped assets and local-optimized assets.
 */
export default function OptimizedImage({ 
  optimizedPath, 
  fallbackPath, 
  alt, 
  ...props 
}: OptimizedImageProps) {
  // Default to optimized if we are in production, otherwise use fallback
  const [imgSrc, setImgSrc] = useState<string>(
    process.env.NEXT_PUBLIC_APP_ENV === 'production' && optimizedPath 
      ? optimizedPath 
      : fallbackPath
  );

  const [hasError, setHasError] = useState(false);

  // If the optimized image fails to load (e.g., CI skipped it), 
  // revert to the unoptimized fallback immediately.
  const handleError = () => {
    if (!hasError) {
      console.warn(`Asset missing: ${imgSrc}. Falling back to: ${fallbackPath}`);
      setImgSrc(fallbackPath);
      setHasError(true);
    }
  };

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
      // Critical for Netlify: prevents redundant double-optimization 
      // if NEXT_OPTIMIZE_IMAGES is true in toml
      unoptimized={props.unoptimized || false} 
    />
  );
}