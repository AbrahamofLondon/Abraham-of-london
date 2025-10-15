// components/homepage/HeroBanner.tsx
import * as React from "react";
import Image from "next/image";
import clsx from "clsx";

export type VideoSource = { src: string; type: string };

export type HeroBannerProps = {
  /** Poster image path (public/...) shown immediately and as video poster */
  poster: string;
  /** Optional sources for autoplaying background video */
  videoSources?: VideoSource[];
  /** Optional overlay content (eyebrow, title, body, button, etc.) */
  overlay?: React.ReactNode;
  /** Tailwind object-position helpers for mobile (applied to video & poster) */
  mobileObjectPositionClass?: string;
  /** Tailwind height classes for the banner container */
  heightClassName?: string;
  /** If true, prioritize the poster image */
  priorityPoster?: boolean;
};

export default function HeroBanner({
  poster,
  videoSources,
  overlay,
  mobileObjectPositionClass = "object-center md:object-center",
  heightClassName = "h-[56svh] md:h-[72svh] lg:h-[78svh]",
  priorityPoster = true,
}: HeroBannerProps) {
  const hasVideo = Array.isArray(videoSources) && videoSources.length > 0;

  return (
    <section className={clsx("relative w-full overflow-hidden bg-black", heightClassName)}>
      {/* Poster (always rendered so there’s no flash even if video stalls) */}
      <Image
        src={poster}
        alt=""
        fill
        sizes="100vw"
        priority={priorityPoster}
        className={clsx("pointer-events-none select-none object-cover", mobileObjectPositionClass)}
      />

      {/* Video layer (if provided) */}
      {hasVideo && (
        <video
          className={clsx("absolute inset-0 h-full w-full object-cover", mobileObjectPositionClass)}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          aria-hidden="true"
        >
          {videoSources!.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      )}

      {/* Scrims to keep overlay readable */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(212,175,55,.14),transparent_60%)] dark:bg-[radial-gradient(80%_60%_at_50%_0%,rgba(212,175,55,.22),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.25),transparent_30%,transparent_70%,rgba(0,0,0,0.35))]"
      />

      {/* Content container */}
      {overlay ? (
        <div className="relative z-[1] mx-auto flex h-full max-w-7xl items-end px-4 pb-10 text-cream">
          <div className="max-w-3xl drop-shadow-[0_1px_12px_rgba(0,0,0,.35)]">{overlay}</div>
        </div>
      ) : null}
    </section>
  );
}
