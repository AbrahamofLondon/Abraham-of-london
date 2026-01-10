// components/CtaArt.tsx
import * as React from "react";
import Image from "next/image";
import clsx from "clsx";

type Props = { 
  className?: string;
  priority?: boolean;
};

export default function CtaArt({ className, priority = false }: Props) {
  // Try webp then jpg; add a cache-buster so any old 404 isn't reused by the CDN
  const candidates = React.useMemo(
    () => [
      "/assets/images/cta/cta-bg.webp?v=2",
      "/assets/images/cta/cta-bg.jpg?v=2",
    ],
    []
  );

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Safely get the src with guaranteed fallback
  const src: string = candidates[currentIndex] ?? candidates[0] ?? "/assets/images/cta/cta-bg.jpg";

  const fallbackBackground =
    "linear-gradient(135deg, rgba(253,224,71,0.9) 0%, rgba(234,179,8,0.9) 50%, rgba(202,138,4,0.9) 100%)";

  const handleError = React.useCallback(() => {
    if (currentIndex + 1 < candidates.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
    setIsLoading(false);
  }, [currentIndex, candidates.length]);

  const handleLoad = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-lightGrey shadow-card",
        "aspect-[4/3] w-full", // gives the box a real height
        "group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]",
        isLoading && "animate-pulse",
        className
      )}
      aria-hidden="true"
    >
      {/* Loading shimmer effect */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-50/50 to-transparent animate-shimmer" />
      )}

      {/* Graceful fallback if image fails */}
      {hasError ? (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: fallbackBackground }}
        >
          <div className="text-center p-4">
            <div className="text-4xl mb-2 opacity-80">✨</div>
            <p className="text-white/90 font-medium">Premium Quality</p>
            <p className="text-white/70 text-sm">Abraham of London</p>
          </div>
        </div>
      ) : (
        <>
          {/* Subtle gradient overlay for better text readability when used as background */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={clsx(
              "object-cover transition-all duration-500",
              isLoading ? "scale-110 blur-sm" : "scale-100 blur-0",
              "group-hover:scale-105"
            )}
            onError={handleError}
            onLoad={handleLoad}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
          />
        </>
      )}
      
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-yellow-400/30 rounded-tl-2xl" />
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-yellow-400/30 rounded-br-2xl" />
    </div>
  );
}
