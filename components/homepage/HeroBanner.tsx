// components/homepage/HeroBanner.tsx
"use client"; // ✅ UPGRADE: Explicitly marking as Client Component, as it uses Hooks

import * as React from "react";
import clsx from "clsx";
import Image from "next/image";

// --- Type Definitions ---

type VideoSource = {
  src: string;
  type: "video/webm" | "video/mp4";
  /** Optional media query for conditional loading (e.g., mobile video) */
  media?: string;
};

type Props = {
  poster: string;
  videoSources?: ReadonlyArray<VideoSource> | null;
  /** Accepts null; will be normalized */
  heightClassName?: string | null;
  /** Tailwind class for object-position (e.g., 'object-top', 'object-center') */
  mobileObjectPositionClass?: string;
  /** Content to display over the banner (e.g., title, CTA) */
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

  // Safely coerce videoSources into an array
  const sources: ReadonlyArray<VideoSource> = Array.isArray(videoSources) ? videoSources : [];
  const hasVideo = sources.length > 0;

  // ✅ UPGRADE: Use more modern and reliable viewport units
  const normalizedHeight = heightClassName ?? "min-h-[70dvh] sm:min-h-[72dvh] lg:min-h-[78lvh]";

  // --- Reduced Motion and Playback Logic ---
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v || typeof window === 'undefined' || !("matchMedia" in window)) return;
    
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    const handlePlayback = () => {
      // If reduced motion is preferred, ensure video is paused
      if (mql.matches) {
        v.pause();
        return;
      }
      
      // Attempt to play, catching the common "play() failed" exception
      v.play().catch(error => {
         // This is often a non-critical error (e.g., browser silently blocked autoplay)
         // console.error("Video autoplay failed:", error); 
      });
    };
    
    // Initial check and setup listener
    handlePlayback();
    mql.addEventListener("change", handlePlayback);

    // Cleanup listener on component unmount
    return () => mql.removeEventListener("change", handlePlayback);
  }, [hasVideo]); // Only re-run if video presence changes

  // --- Image Fallback Props ---
  const imageProps = {
    src: poster,
    // ✅ UPGRADE: Explicit decorative alt text for Image component
    alt: "Decorative, high-impact background image for the main hero section", 
    className: clsx("h-full w-full object-cover", mobileObjectPositionClass),
    fill: true as const,
    sizes: "100vw",
    priority: true as const, // Essential for LCP optimization
    // Removed draggable: unnecessary and often broken on mobile
  };

  return (
    <section
      // Use role="banner" for semantic meaning in hero sections
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
          // ✅ UPGRADE: Use 'metadata' for faster poster load, 'auto' is overly aggressive
          preload="metadata" 
          aria-hidden="true" // Video is decorative/background
          // ✅ UPGRADE: Block right-click context menu (security/UX)
          onContextMenu={(e) => e.preventDefault()} 
        >
          {sources.map((s, i) => (
            // ✅ SAFE: Properly handle optional media prop
            <source 
              key={i} 
              src={s.src} 
              type={s.type} 
              {...(s.media ? { media: s.media } : {})} 
            />
          ))}
          {/* Fallback: if video fails completely, the poster image defined below will show */}
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
          {/* ✅ SAFE: Ensure overlay content contrast */}
          <div className="text-cream drop-shadow-[0_1px_10px_rgba(0,0,0,.35)]">{overlay}</div>
        </div>
      ) : null}

      {/* Noscript fallback for poster (essential for non-JS/server-side rendering) */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Decorative fallback image for hero section."
          src={poster}
          className={clsx("absolute inset-0 h-full w-full object-cover", mobileObjectPositionClass)}
          loading="lazy"
        />
      </noscript>
    </section>
  );
}