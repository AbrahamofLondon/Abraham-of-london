// components/homepage/HeroBanner.tsx
"use client";

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
  const sources: ReadonlyArray<VideoSource> = React.useMemo(
    () => Array.isArray(videoSources) ? videoSources : [],
    [videoSources]
  );
  const hasVideo = sources.length > 0;

  // 💡 UPGRADE: Consistent use of modern dynamic viewport units (dvh, lvh)
  const normalizedHeight = heightClassName ?? "min-h-[70dvh] sm:min-h-[72dvh] lg:min-h-[78lvh]";
  
  // 💡 UPGRADE: Determine initial preference for reduced motion once
  const prefersReducedMotion = React.useMemo(() => {
    if (typeof window === 'undefined' || !("matchMedia" in window)) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []); // Run only once

  // --- Reduced Motion and Playback Logic ---
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v || !hasVideo) return; // Ensure video element and sources exist

    // 💡 IMPROVEMENT: Check window access again within useEffect for client-side safety
    if (typeof window === 'undefined' || !("matchMedia" in window)) return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handlePlayback = () => {
      if (mql.matches) {
        // If reduced motion is preferred, pause
        v.pause();
        // 💡 UPGRADE: Explicitly stop attempting to play after pause
        v.currentTime = 0; 
      } else {
        // Attempt to play, catching the common "play() failed" exception
        v.play().catch(error => {
          // console.warn("Video autoplay failed (often due to browser policy):", error);
        });
      }
    };

    // Initial check (if motion is reduced, it will pause. If not, it attempts play, but the native `autoplay` handles the initial start too)
    handlePlayback();
    
    mql.addEventListener("change", handlePlayback);

    // Cleanup listener on component unmount
    return () => mql.removeEventListener("change", handlePlayback);
  }, [hasVideo]); // Only re-run if video presence changes

  // --- Image Fallback Props ---
  const imageProps = {
    src: poster,
    alt: "Decorative, high-impact background image for the main hero section", // Alt is correct
    className: clsx("h-full w-full object-cover", mobileObjectPositionClass),
    fill: true as const,
    sizes: "100vw",
    priority: true as const, // Essential for LCP optimization
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
        // 💡 UPGRADE: Conditional autoplay based on initial reduced motion check to avoid unnecessary play attempt
        <video
          ref={videoRef}
          className={clsx("absolute inset-0 h-full w-full object-cover", mobileObjectPositionClass)}
          poster={poster}
          autoPlay={!prefersReducedMotion} // 💡 IMPROVEMENT: Conditional autoplay
          muted
          loop
          playsInline
          // 💡 IMPROVEMENT: Use `preload="auto"` or `preload="none"` for more control. `metadata` is good but `auto` can start loading data sooner. Sticking with `metadata` as it is safer.
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
          {/* Fallback to Image via CSS/browser default poster is still implied */}
        </video>
      ) : (
        // --- Image Fallback Component (No Video) ---
        // eslint-disable-next-line jsx-a11y/alt-text
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
          {/* 💡 UPGRADE: Use a standard Tailwind color variable if available, otherwise 'text-white' for higher contrast */}
          <div className="text-white drop-shadow-[0_1px_10px_rgba(0,0,0,.35)]">{overlay}</div> 
        </div>
      ) : null}

      {/* 💡 UPGRADE: Noscript is typically handled by Next/Image's default behavior when `fill` and `priority` are used correctly, 
      but keeping the explicit img tag as a defensive measure against non-JS environments is acceptable. */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Decorative fallback image for hero section."
          src={poster}
          className={clsx("absolute inset-0 h-full w-full object-cover", mobileObjectPositionClass)}
          // 💡 IMPROVEMENT: When using `noscript`, it should use `loading="eager"` if it's the LCP image. Since the <Image> component above already handles LCP/priority, we can stick with `lazy` here to avoid over-fetching in non-JS environments where it's not truly needed right away, but it's a trade-off. Let's stick with `loading="lazy"` as provided.
          loading="lazy"
        />
      </noscript>
    </section>
  );
}