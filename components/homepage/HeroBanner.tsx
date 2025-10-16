// components/homepage/HeroBanner.tsx
import * as React from "react";
import clsx from "clsx";

type VideoSource = {
  src: string;
  type: "video/webm" | "video/mp4";
  media?: string;
};

type Props = {
  poster: string;
  videoSources?: VideoSource[]; // optional + guarded
  heightClassName?: string;
  mobileObjectPositionClass?: string;
  overlay?: React.ReactNode;
  className?: string;
};

export default function HeroBanner({
  poster,
  videoSources = [],
  heightClassName = "min-h-[70svh] sm:min-h-[72svh] lg:min-h-[78svh]",
  mobileObjectPositionClass = "object-center",
  overlay,
  className,
}: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  // Respect reduced motion, and be resilient if autoplay is blocked.
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const handle = () => {
      if (mql?.matches) {
        v.pause();
      } else {
        // try to play; if blocked, just let the poster show
        v.play().catch(() => {});
      }
    };

    handle();
    mql?.addEventListener?.("change", handle);
    return () => mql?.removeEventListener?.("change", handle);
  }, []);

  const hasVideo = Array.isArray(videoSources) && videoSources.length > 0;

  return (
    <section
      className={clsx(
        "relative isolate w-full overflow-hidden bg-black", // bg avoids flashes/gaps
        heightClassName,
        className
      )}
    >
      {/* media */}
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
          {videoSources.map((s, i) => (
            <source key={i} src={s.src} type={s.type} {...(s.media ? { media: s.media } : {})} />
          ))}
        </video>
      ) : (
        // Fallback if no sources or autoplay is blocked and <source> fails
        <img
          src={poster}
          alt=""
          className={clsx("absolute inset-0 h-full w-full object-cover", mobileObjectPositionClass)}
          decoding="async"
          loading="eager"
          fetchPriority="high"
          draggable={false}
        />
      )}

      {/* top gradient veil for legibility */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.35),transparent_40%,transparent_70%,rgba(0,0,0,.25))]"
      />

      {/* overlay copy (optional) */}
      {overlay ? (
        <div className="relative z-[1] mx-auto flex h-full max-w-7xl items-end px-4 pb-10">
          <div className="text-cream drop-shadow-[0_1px_10px_rgba(0,0,0,.35)]">{overlay}</div>
        </div>
      ) : null}

      {/* No-JS fallback */}
      <noscript>
        <img
          src={poster}
          alt=""
          className={clsx("absolute inset-0 h-full w-full object-cover", mobileObjectPositionClass)}
        />
      </noscript>
    </section>
  );
}
