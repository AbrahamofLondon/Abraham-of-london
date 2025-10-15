// components/homepage/HeroBanner.tsx
import * as React from "react";
import Image from "next/image";

export type VideoSource = { src: string; type: string };

type HeroBannerProps = {
  videoSources?: VideoSource[];
  poster?: string;
  mobileObjectPositionClass?: string;
  overlay?: React.ReactNode;
  showMute?: boolean;
  kenBurnsIfNoVideo?: boolean;
  heightClassName?: string;
  className?: string;
};

function normalize(src?: string) {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  return src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;
}

export default function HeroBanner({
  videoSources,
  poster,
  mobileObjectPositionClass = "object-center md:object-center",
  overlay,
  showMute = true,
  kenBurnsIfNoVideo = true,
  heightClassName,
  className,
}: HeroBannerProps) {
  const hasVideo = Array.isArray(videoSources) && videoSources.length > 0;
  const posterSrc = normalize(poster) ?? "/assets/images/abraham-of-london-banner.webp";

  // Persist mute preference
  const [muted, setMuted] = React.useState(true);
  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("aol-hero-muted") : null;
    if (saved !== null) setMuted(saved === "1");
  }, []);
  React.useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("aol-hero-muted", muted ? "1" : "0");
  }, [muted]);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  return (
    <section
      className={[
        "relative w-full overflow-hidden bg-black",
        heightClassName ?? "h-[52vh] sm:h-[60vh] md:h-[70vh] lg:h-[78vh] xl:h-[86vh]",
        className || "",
      ].join(" ")}
      aria-label="Brand banner"
    >
      {/* Media */}
      {hasVideo ? (
        <video
          ref={videoRef}
          className={["absolute inset-0 h-full w-full object-cover", mobileObjectPositionClass].join(" ")}
          autoPlay
          muted
          loop
          playsInline
          poster={posterSrc}
          preload="metadata"
        >
          {videoSources!.map((s) => (
            <source key={s.src} src={normalize(s.src)} type={s.type} />
          ))}
        </video>
      ) : (
        <div className={["absolute inset-0", kenBurnsIfNoVideo ? "aol-kenburns" : ""].join(" ")}>
          <Image
            src={posterSrc!}
            alt=""
            fill
            priority
            sizes="100vw"
            className={["object-cover", mobileObjectPositionClass].join(" ")}
          />
        </div>
      )}

      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_10%,rgba(0,0,0,.22),transparent_65%)]"
      />

      {/* Overlay */}
      {overlay ? (
        <div className="absolute inset-0 z-[1] flex items-end md:items-center">
          <div className="mx-auto w-full max-w-7xl px-4 pb-8 md:pb-0">
            <div className="max-w-2xl animate-fadeUp text-cream">{overlay}</div>
          </div>
        </div>
      ) : null}

      {/* Mute */}
      {hasVideo && showMute ? (
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="absolute bottom-4 right-4 z-[2] rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-deepCharcoal shadow-sm backdrop-blur hover:bg-white"
          aria-label={muted ? "Unmute background video" : "Mute background video"}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      ) : null}

      {/* Ken Burns styles (no arbitrary Tailwind values) */}
      <style jsx global>{`
        @keyframes aol-kenburns-zoom {
          from { transform: scale(1); }
          to   { transform: scale(1.08); }
        }
        .aol-kenburns {
          will-change: transform;
        }
        @media (prefers-reduced-motion: no-preference) {
          .aol-kenburns { animation: aol-kenburns-zoom 22s ease-in-out infinite alternate; }
        }
      `}</style>
    </section>
  );
}
