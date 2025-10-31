import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

// --- Utility Hook ---

/**
 * Handles video playback logic, specifically respecting the 'prefers-reduced-motion' setting.
 */
const useReducedMotionVideo = (
  videoRef: React.RefObject<HTMLVideoElement>, 
  hasVideo: boolean
) => {
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v || !hasVideo || typeof window === 'undefined' || !("matchMedia" in window)) return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handlePlayback = () => {
      if (mql.matches) {
        v.pause();
        v.currentTime = 0; // Reset video to frame 0
      } else {
        // Attempt to play, catching errors which are common with autoplay policies
        v.play().catch(() => { /* Silent fail is acceptable here */ });
      }
    };

    handlePlayback();
    mql.addEventListener("change", handlePlayback);

    return () => mql.removeEventListener("change", handlePlayback);
  }, [hasVideo, videoRef]);
};

// --- Utility Components & Types ---

/** Small “eyebrow” pill used above the H1 */
function Eyebrow({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full",
        "border border-lightGrey/70 bg-warmWhite/70 px-3 py-1",
        "text-xs uppercase tracking-wide font-semibold",
        "text-[color:var(--color-on-secondary)/0.7] dark:text-[color:var(--color-on-primary)/0.8]",
        className
      )}
    >
      {children}
    </span>
  );
}

type Cta = { href: string; label: string; ariaLabel?: string };
type VideoSource = { src: string; type: string };
type AspectRatio = "book" | "wide" | "square" | "cover-wide";

type HeroProps = {
  title?: string;
  subtitle?: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  coverImage?: string | null;
  coverAspect?: AspectRatio;
  coverFit?: "contain" | "cover";
  coverPosition?: "left" | "center" | "right" | "top" | "bottom";
  videoSources?: VideoSource[] | null;
  poster?: string | null;
  eyebrow?: string;
};

// --- Utilities ---

function normalizeLocal(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  const cleanSrc = src.replace(/^\/+/, "");
  return `/${cleanSrc}`;
}

function getAspectClass(aspect: AspectRatio): string {
  switch (aspect) {
    case "square": return "aspect-[1/1]";
    case "wide": return "aspect-[16/9]";
    case "cover-wide": return "aspect-[21/9]";
    case "book":
    default: return "aspect-[2/3]";
  }
}

// --- Main Component ---

export default function HeroSection({
  title = "When the System Breaks You: Finding Purpose in Pain",
  subtitle = "Win the only battle you fully control — the one inside your chest.",
  eyebrow = "Featured Insight",
  primaryCta = {
    href: "/downloads/Fathering_Without_Fear_Teaser-Mobile.pdf",
    label: "Get the free teaser",
    ariaLabel: "Download the Fathering Without Fear Teaser PDF",
  },
  secondaryCta = { href: "/blog", label: "Read the latest insights" },

  coverImage,
  coverAspect = "book",
  coverFit = "contain",
  coverPosition = "center",

  videoSources = [],
  poster = null,
}: HeroProps) {

  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  // 1. --- Core Data and Fallbacks ---
  const defaultImage = "/assets/images/abraham-of-london-banner.webp";
  const imgSrc = normalizeLocal(coverImage) || normalizeLocal(defaultImage)!;
  const hasVideo = Array.isArray(videoSources) && videoSources.length > 0;
  const posterSrc = normalizeLocal(poster) || imgSrc;

  useReducedMotionVideo(videoRef, hasVideo);

  // 2. --- Dynamic Class Generation ---

  const frameClasses = clsx(
    "relative w-full overflow-hidden rounded-2xl shadow-card",
    getAspectClass(coverAspect),
    {
      // Padding/Background for 'contain' fit to create a frame
      "p-2 sm:p-3 md:p-4 bg-warmWhite border border-lightGrey/70": coverFit === "contain",
    }
  );

  const mediaClasses = clsx(
    "absolute inset-0 h-full w-full",
    coverFit === "contain" ? "object-contain" : "object-cover",
    {
      "object-left": coverPosition === "left",
      "object-right": coverPosition === "right",
      "object-top": coverPosition === "top",
      "object-bottom": coverPosition === "bottom",
      "object-center": coverPosition === "center",
    }
  );

  return (
    <section
      className={clsx(
        "relative overflow-hidden bg-white dark:bg-black",
        // Decorative pseudo-elements for background glow/gradient
        "before:pointer-events-none before:absolute before:inset-0",
        "before:bg-[radial-gradient(80%_60%_at_50%_0%,rgba(212,175,55,.14),transparent_60%)]",
        "dark:before:bg-[radial-gradient(80%_60%_at_50%_0%,rgba(212,175,55,.22),transparent_60%)]"
      )}
      role="region"
      aria-label="Featured content section"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-2 md:gap-12 md:py-16">

        {/* LEFT: copy */}
        <div className="relative z-[1]">
          {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}

          <h1 
            id="hero-title"
            className="font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-semibold leading-[1.08] text-deepCharcoal dark:text-cream [text-wrap:balance]"
          >
            {title}
          </h1>

          {subtitle && (
            <p className="mt-4 max-w-prose text-[color:var(--color-on-secondary)/0.85] dark:text-[color:var(--color-on-primary)/0.85]">
              {subtitle}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {/* Primary CTA */}
            {primaryCta && (
              <Link
                href={primaryCta.href}
                aria-label={primaryCta.ariaLabel || `Go to ${primaryCta.label}`}
                className="aol-btn"
              >
                {primaryCta.label}
              </Link>
            )}

            {/* Secondary CTA */}
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                aria-label={secondaryCta.ariaLabel || `Go to ${secondaryCta.label}`}
                className="rounded-full border border-lightGrey bg-warmWhite px-4 py-2 text-sm font-semibold text-deepCharcoal transition hover:brightness-[.98] focus:outline-none focus-visible:ring-2"
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT: visual media container */}
        <div className={frameClasses}>

          {/* Gradient veil for cover-fit visuals */}
          {coverFit === "cover" && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[1]
                         bg-[linear-gradient(to_bottom,rgba(0,0,0,0.30),transparent_35%,transparent_65%,rgba(0,0,0,0.25))]
                         dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.45),transparent_40%,transparent_60%,rgba(0,0,0,0.35))]"
            />
          )}

          {/* Media: Video or Image Fallback */}
          {hasVideo ? (
            // Video (if sources are provided)
            <video
              ref={videoRef}
              className={mediaClasses}
              // autoPlay managed by the hook
              muted
              loop
              playsInline
              preload="metadata"
              poster={posterSrc}
              aria-describedby="hero-title"
              onContextMenu={(e) => e.preventDefault()}
            >
              {videoSources!.map((s) => (
                <source key={s.src} src={normalizeLocal(s.src)} type={s.type} />
              ))}
            </video>
          ) : (
            // Image (default or if no video sources provided)
            <Image
              src={imgSrc}
              alt={title || "Hero image illustrating the page content"}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className={mediaClasses}
            />
          )}
        </div>
      </div>

      {/* Decorative grid dots */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:18px_18px] dark:opacity-30"
      />
    </section>
  );
}