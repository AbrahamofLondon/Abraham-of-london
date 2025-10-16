// components/homepage/HeroBanner.tsx
import * as React from "react";
import Image from "next/image";

export type VideoSource = { src: string; type: string; media?: string };

type HeroBannerProps = {
  poster: string;
  videoSources?: VideoSource[];
  overlay?: React.ReactNode;
  className?: string;
  mobileObjectPositionClass?: string;
  heightClassName?: string;
};

export default function HeroBanner({
  poster,
  videoSources = [],
  overlay,
  className = "",
  mobileObjectPositionClass = "object-center",
  heightClassName = "h-[min(88vh,900px)] sm:h-[82vh]",
}: HeroBannerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [shouldPlay, setShouldPlay] = React.useState(false);

  // Reduced motion check — guarded for SSR
  const prefersReduced = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  React.useEffect(() => {
    if (prefersReduced) return;
    const el = videoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && setShouldPlay(true),
      { rootMargin: "200px 0px 0px 0px", threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [prefersReduced]);

  React.useEffect(() => {
    if (!shouldPlay || prefersReduced) return;
    videoRef.current?.play().catch(() => {});
  }, [shouldPlay, prefersReduced]);

  return (
    <section className={`relative isolate w-full ${heightClassName} ${className}`}>
      {/* Instant paint poster */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={poster}
          alt=""
          fill
          priority
          sizes="100vw"
          className={`object-cover ${mobileObjectPositionClass}`}
        />
      </div>

      {/* Video (client will hydrate when visible) */}
      {!prefersReduced && videoSources.length > 0 && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover ${mobileObjectPositionClass}`}
          playsInline
          muted
          loop
          preload="auto"
          poster={poster}
          aria-hidden
        >
          {videoSources.map((s, i) => (
            <source key={`${s.src}-${i}`} src={s.src} type={s.type} media={s.media} />
          ))}
        </video>
      )}

      {/* Soft vignette for legibility */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />

      {/* Overlay */}
      {overlay ? (
        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-4 pb-10 sm:pb-14">
          <div className="max-w-3xl text-cream drop-shadow-md">{overlay}</div>
        </div>
      ) : null}
    </section>
  );
}
