components/homepage/HeroBanner.tsx
import * as React from "react";
import HighQImage from "@/components/HighQImage";

export type VideoSource = {
  src: string;
  type: string;          // e.g. "video/webm" or "video/mp4"
  media?: string;        // optional media query
};

type HeroBannerProps = {
  poster: string;                            // /public path
  videoSources?: VideoSource[];              // AV1 → VP9 → H.264 order
  overlay?: React.ReactNode;                 // overlay content (safe HTML/React)
  className?: string;
  /** object-position helper (Tailwind) for mobile crop, e.g. "object-[50%_30%]" */
  mobileObjectPositionClass?: string;
  /** height utility string. default = responsive full-bleed band */
  heightClassName?: string;
};

/**
 * Full-bleed, media-first hero. Respects reduced motion and defers playback
 * until intersecting viewport. AV1→VP9→H.264 fallback ordering for quality+reach.
 */
export default function HeroBanner({
  poster,
  videoSources = [],
  overlay,
  className = "",
  mobileObjectPositionClass = "object-center",
  heightClassName = "h-[min(88vh,900px)] sm:h-[82vh]",
}: HeroBannerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [canPlay, setCanPlay] = React.useState(false);
  const [shouldPlay, setShouldPlay] = React.useState(false);

  // Reduced motion: never autoplay video
  const prefersReduced = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Defer loading/playing until the hero enters viewport a bit
  React.useEffect(() => {
    if (prefersReduced) return; // show poster only
    const el = videoRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShouldPlay(true);
          }
        }
      },
      { rootMargin: "200px 0px 0px 0px", threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [prefersReduced]);

  // When we should play and the video can play, attempt autoplay
  React.useEffect(() => {
    const el = videoRef.current;
    if (!el || !shouldPlay || prefersReduced) return;
    el.play().catch(() => {
      // if autoplay fails (rare with muted), we still show the poster
    });
  }, [shouldPlay, prefersReduced]);

  return (
    <section className={`relative isolate w-full ${heightClassName} ${className}`}>
      {/* Poster underneath for instant paint */}
      <div className="absolute inset-0 -z-10">
        <HighQImage
          src={poster}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
          className={mobileObjectPositionClass}
          aboveTheFold
        />
      </div>

      {/* Video layer (hidden if reduced motion) */}
      {!prefersReduced && videoSources.length > 0 && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover ${mobileObjectPositionClass}`}
          playsInline
          muted
          loop
          preload="auto"
          poster={poster}
          onCanPlay={() => setCanPlay(true)}
          aria-hidden
        >
          {videoSources.map((s, i) => (
            <source key={`${s.src}-${i}`} src={s.src} type={s.type} media={s.media} />
          ))}
        </video>
      )}

      {/* Decorative soft vignette for text legibility */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30"
      />

      {/* Overlay content (title/CTA/etc) */}
      {overlay ? (
        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-4 pb-10 sm:pb-14">
          <div className="max-w-3xl text-cream drop-shadow-md">
            {overlay}
          </div>
        </div>
      ) : null}
    </section>
  );
}
