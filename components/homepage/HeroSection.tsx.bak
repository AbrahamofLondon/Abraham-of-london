import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx"; // ✅ UPGRADE: Use clsx for cleaner class string concatenation

// --- Utility Components ---

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
        "text-xs uppercase tracking-wide font-semibold", // ✅ UPGRADE: Added font-semibold
        "text-[color:var(--color-on-secondary)/0.7] dark:text-[color:var(--color-on-primary)/0.8]",
        className
      )}
    >
      {children}
    </span>
  );
}

// --- Type Definitions ---

type Cta = { href: string; label: string; ariaLabel?: string };
type VideoSource = { src: string; type: string };
type AspectRatio = "book" | "wide" | "square" | "cover-wide"; // ✅ UPGRADE: Added 'cover-wide' (21/9)

type HeroProps = {
  title?: string;
  subtitle?: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;

  /** Image shown when no video or as poster fallback */
  coverImage?: string | null;
  /** Aspect ratio: 'book' (2/3), 'wide' (16/9), 'square' (1/1), 'cover-wide' (21/9) */
  coverAspect?: AspectRatio;
  /** 'contain' (book covers) or 'cover' (edge-to-edge) */
  coverFit?: "contain" | "cover";
  /** object position for Image/Video */
  coverPosition?: "left" | "center" | "right" | "top"; // ✅ UPGRADE: Added 'top'

  /** Optional autoplaying looped background video */
  videoSources?: VideoSource[] | null;
  /** Poster image for the video (defaults to coverImage) */
  poster?: string | null;

  eyebrow?: string;
};

// --- Utilities ---

/**
 * Normalizes a URL path: ensures relative paths start with a slash.
 * @param src The source string.
 * @returns Normalized URL string or undefined.
 */
function normalizeLocal(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  const cleanSrc = src.replace(/^\/+/, "");
  return `/${cleanSrc}`;
}

/**
 * Maps the AspectRatio prop to the corresponding Tailwind class.
 */
function getAspectClass(aspect: AspectRatio): string {
  switch (aspect) {
    case "square": return "aspect-[1/1]";
    case "wide": return "aspect-[16/9]";
    case "cover-wide": return "aspect-[21/9]"; // ✅ UPGRADE: New aspect ratio
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
    ariaLabel: "Download the Fathering Without Fear Teaser PDF", // ✅ UPGRADE: More explicit default ARIA
  },
  secondaryCta = { href: "/blog", label: "Read the latest insights" },

  coverImage,
  coverAspect = "book",
  coverFit = "contain",
  coverPosition = "center",

  videoSources = [],
  poster = null,
}: HeroProps) {

  // 1. --- Core Data and Fallbacks ---
  const defaultImage = "/assets/images/abraham-of-london-banner.webp";
  const imgSrc = normalizeLocal(coverImage) || normalizeLocal(defaultImage)!;
  const hasVideo = Array.isArray(videoSources) && videoSources.length > 0;
  const posterSrc = normalizeLocal(poster) || imgSrc;

  // 2. --- Dynamic Class Generation (Consolidated using clsx) ---

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
      "object-top": coverPosition === "top", // ✅ UPGRADE: Added top position
      "object-center": coverPosition === "center", // Default position
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
      // ✅ UPGRADE: Added explicit ARIA role for semantic context
      role="region"
      aria-label="Featured content section"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-2 md:gap-12 md:py-16">

        {/* LEFT: copy */}
        <div className="relative z-[1]">
          {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}

          <h1 className="font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-semibold leading-[1.08] text-deepCharcoal dark:text-cream [text-wrap:balance]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-4 max-w-prose text-[color:var(--color-on-secondary)/0.85] dark:text-[color:var(--color-on-primary)/0.85]">
              {subtitle}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {/* Primary CTA (using aol-btn, assumed to be robustly styled) */}
            {primaryCta && (
              <Link
                href={primaryCta.href}
                aria-label={primaryCta.ariaLabel || `Go to ${primaryCta.label}`} // ✅ UPGRADE: Fallback ARIA label
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

          {/* Gradient veil for cover-fit visuals (retained) */}
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
              className={mediaClasses}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={posterSrc}
              aria-describedby="hero-title" // ✅ UPGRADE: Accessibility link to the main content
              // ✅ UPGRADE: Added onContextMenu to prevent right-click downloads
              onContextMenu={(e) => e.preventDefault()}
            >
              {videoSources!.map((s) => (
                <source key={s.src} src={normalizeLocal(s.src)} type={s.type} />
              ))}
              {/* Image poster will serve as the final fallback if video playback fails */}
            </video>
          ) : (
            // Image (default or if no video sources provided)
            <Image
              src={imgSrc}
              alt={title || "Hero image illustrating the page content"} // ✅ UPGRADE: Alt text based on title
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className={mediaClasses}
            />
          )}
        </div>
      </div>

      {/* Decorative grid dots (retained) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:18px_18px] dark:opacity-30"
      />
    </section>
  );
}