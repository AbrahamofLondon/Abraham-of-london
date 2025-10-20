// components/homepage/HeroBanner.tsx
import * as React from "react";
import clsx from "clsx";
import Image from "next/image";

type VideoSource = {
  src: string;
  type: "video/webm" | "video/mp4";
  media?: string;
};

type Props = {
  poster: string;
  videoSources?: ReadonlyArray<VideoSource> | null;
  /** Accepts null; will be normalized */
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

  // Normalize height
  const normalizedHeight = heightClassName ?? "min-h-[70svh] sm:min-h-[72svh] lg:min-h-[78svh]";

  // Respect reduced motion
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v || !("matchMedia" in window)) return;
    // Check for `window` before calling `matchMedia` for safety on platforms without it
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handle = () => {
      if (mql.matches) v.pause();
      else v.play().catch(() => {});
    };
    handle();
    mql.addEventListener?.("change", handle);
    return () => mql.removeEventListener?.("change", handle);
  }, []);

  // Props for image fallback
  const imageProps = {
    src: poster,
    alt: "", // decorative background image
    className: clsx("h-full w-full object-cover", mobileObjectPositionClass),
    fill: true as const,
    sizes: "100vw",
    priority: true as const, // Set priority to true for LCP image
    draggable: false,
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
        <Image {...imageProps} alt="Decorative background image for hero section" />
      )}

      {/* Subtle top/bottom gradient for legibility */}
      <div
        aria-hidden
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
          alt=""
          src={poster}
          className={clsx("absolute inset-0 h-full w-full object-cover", mobileObjectPositionClass)}
        />
      </noscript>
    </section>
  );
}