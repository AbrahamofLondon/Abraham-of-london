// components/homepage/HeroBanner.tsx
import * as React from "react";
import clsx from "clsx";
import Image from "next/image"; // Should be imported now

type VideoSource = { src: string; type: "video/webm" | "video/mp4"; media?: string };

type Props = {
  poster: string;
  videoSources?: ReadonlyArray<VideoSource> | null;
  /** accept null; we’ll normalize */
  heightClassName?: string | null;
  mobileObjectPositionClass?: string;
  overlay?: React.ReactNode;
  className?: string;
};

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

  // normalize height
  const normalizedHeight =
    heightClassName ?? "min-h-[70svh] sm:min-h-[72svh] lg:min-h-[78svh]";

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const handle = () => {
      if (mql?.matches) v.pause();
      else v.play().catch(() => {});
    };
    handle();
    mql?.addEventListener?.("change", handle);
    return () => mql?.removeEventListener?.("change", handle);
  }, []);

  // Props used for the replacement Image component
  const imageProps = {
    src: poster,
    alt: "",
    className: clsx("h-full w-full object-cover", mobileObjectPositionClass),
    // Crucial for background images in a full-bleed container
    fill: true as const,
    // Helps Next.js optimize the image size and format
    sizes: "100vw",
  };

  return (
    <section
      className={clsx(
        "relative isolate w-full overflow-hidden bg-black",
        normalizedHeight,
        className
      )}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          className={clsx("absolute inset-0 h-full w-full object-cover", mobileObjectPositionClass)}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          {sources.map((s, i) => (
            <source key={i} src={s.src} type={s.type} {...(s.media ? { media: s.media } : {})} />
          ))}
        </video>
      ) : (
        // Replaced <img> with <Image /> to fix LCP warning
        <Image
          {...imageProps}
          priority // Equivalent to loading="eager" and fetchPriority="high"
          draggable={false}
        />
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.35),transparent_40%,transparent_70%,rgba(0,0,0,.25))]"
      />
      {overlay ? (
        <div className="relative z-[1] mx-auto flex h-full max-w-7xl items-end px-4 pb-10">
          <div className="text-cream drop-shadow-[0_1px_10px_rgba(0,0,0,.35)]">{overlay}</div>
        </div>
      ) : null}
      <noscript>
        {/* Revert to <img> for noscript and add alt="" to satisfy linter (jsx-a11y/alt-text) */}
        {/* ADDED eslint-disable @next/next/no-img-element HERE */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster}
          alt="" {/* <-- ADDED THIS */}
          className={clsx("absolute inset-0 h-full w-full object-cover", mobileObjectPositionClass)}
        />
      </noscript>
    </section>
  );
}