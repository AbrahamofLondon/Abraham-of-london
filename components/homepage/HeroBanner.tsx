// components/homepage/HeroBanner.tsx
"use client"; // Explicitly marking as Client Component

import * as React from "react";
import clsx from "clsx";
import Image from "next/image";

// --- Type Definitions ---

type VideoSource = {
  src: string;
  type: "video/webm" | "video/mp4";
  media?: string;
};

type Props = {
  poster: string;
  videoSources?: ReadonlyArray<VideoSource> | null;
  heightClassName?: string | null;
  mobileObjectPositionClass?: string;
  overlay?: React.ReactNode;
  className?: string;
};

// --- Component ---

export default function HeroBanner({
  poster,
  videoSources,
  heightClassName,
  mobileObjectPositionClass = "object-center",
  overlay,
  className,
}: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const sources: ReadonlyArray<VideoSource> = Array.isArray(videoSources) ? videoSources : [];
  const hasVideo = sources.length > 0;

  const normalizedHeight = heightClassName ?? "min-h-[70dvh] sm:min-h-[72dvh] lg:min-h-[78lvh]";

  // --- Reduced Motion and Playback Logic ---
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v || typeof window === 'undefined' || !("matchMedia" in window)) return;
    
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    const handlePlayback = () => {
      if (mql.matches) {
        v.pause();
        return;
      }
      v.play().catch(error => {
        // Silently catch autoplay errors
      });
    };
    
    handlePlayback();
    mql.addEventListener("change", handlePlayback);

    return () => mql.removeEventListener("change", handlePlayback);
  }, [hasVideo]); 

  // --- Image Fallback Props ---
  const imageProps = {
    src: poster,
    // ✅ FIX: Added alt prop as requested to fix the warning
    alt: "", 
    className: clsx("h-full w-full object-cover", mobileObjectPositionClass),
    fill: true as const,
    sizes: "100vw",
    priority: true as const,
  };

  return (
    <section
      role="banner" 
      className={clsx(
        "relative isolate w-full overflow-hidden bg-black",
        normalizedHeight,
        className
      )}
    >
      {hasVideo ? (
        // --- Video Component ---
        <video
          ref={videoRef}
          className={clsx("absolute inset-0 h-full w-full object-cover", mobileObjectPositionClass)}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata" 
          aria-hidden="true"
          onContextMenu={(e) => e.preventDefault()} 
        >
          {sources.map((s, i) => (
            <source 
              key={i} 
              src={s.src} 
              type={s.type} 
              {...(s.media ? { media: s.media } : {})} 
            />
          ))}
        </video>
      ) : (
        // --- Image Fallback Component (No Video) ---
        <Image {...imageProps} />
      )}

      {/* Subtle top/bottom gradient for legibility (Overlay) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.35),transparent_40%,transparent_70%,rgba(0,0,0,.25))]"
      />

      {/* Overlay content (heading/CTA) */}
      {overlay ? (
        <div className="relative z-[1] mx-auto flex h-full max-w-7xl items-end px-4 pb-10">
          <div className="text-cream drop-shadow-[0_1px_10px_rgba(0,0,0,.35)]">{overlay}</div>
        </div>
      ) : null}

      {/* Noscript fallback for poster */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          // ✅ FIX: Added alt prop to noscript tag as well
          alt="Decorative fallback image for hero section."
          src={poster}
          className={clsx("absolute inset-0 h-full w-full object-cover", mobileObjectPositionClass)}
          loading="lazy"
        />
      </noscript>
    </section>
  );
}