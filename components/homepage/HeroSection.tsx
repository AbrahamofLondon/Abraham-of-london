// components/HeroSection.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { BaseCard, CARD_ANIMATIONS } from '@/components/Cards';

// --- Utility Components ------------------------------------------------------

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
        "text-[color:var(--color-on-secondary)] opacity-70",
        "dark:text-[color:var(--color-on-primary)] dark:opacity-80",
        className
      )}
    >
      {children}
    </span>
  );
}

// --- Type Definitions --------------------------------------------------------

type Cta = { href: string; label: string; ariaLabel?: string };
type VideoSource = { src: string; type: string };
type AspectRatio = "book" | "wide" | "square" | "cover-wide";

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
  coverPosition?: "left" | "center" | "right" | "top";

  /** Optional autoplaying looped background video */
  videoSources?: VideoSource[] | null;
  /** Poster image for the video (defaults to coverImage) */
  poster?: string | null;

  eyebrow?: string;
};

// --- Utilities ---------------------------------------------------------------

/**
 * Normalizes a URL path: ensures relative paths start with a slash.
 */
function normalizeLocal(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  const cleanSrc = src.replace(/^\/+/, "");
  return `/${cleanSrc}`;
}

/**
 * Maps the AspectRatio prop to responsive *heights* (not full-screen boxes).
 * The parent controls width; these classes just keep the box civilised.
 */
function getAspectClass(aspect: AspectRatio): string {
  switch (aspect) {
    case "square":
      return "h-[220px] sm:h-[260px] md:h-[300px] lg:h-[340px]";
    case "wide":
      return "h-[200px] sm:h-[230px] md:h-[260px] lg:h-[300px]";
    case "cover-wide":
      return "h-[180px] sm:h-[210px] md:h-[240px] lg:h-[280px]";
    case "book":
    default:
      // Portrait / book-style, but capped
      return "h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px]";
  }
}

// --- Main Component ----------------------------------------------------------

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
  // 1. --- Core Data and Fallbacks ---
  const defaultImage = "/assets/images/abraham-of-london-banner.webp";
  const imgSrc = normalizeLocal(coverImage) || normalizeLocal(defaultImage)!;
  const hasVideo = Array.isArray(videoSources) && videoSources.length > 0;
  const posterSrc = normalizeLocal(poster) || imgSrc;

  // 2. --- Dynamic Class Generation (with clsx) ---
  const frameClasses = clsx(
    "relative overflow-hidden rounded-2xl shadow-lg shadow-black/15",
    // contained visual – NEVER full-width skyscraper
    "max-w-[520px] w-full mx-auto",
    getAspectClass(coverAspect),
    {
      "p-2 sm:p-3 md:p-4 bg-warmWhite border border-lightGrey/70":
        coverFit === "contain",
    }
  );

  const mediaClasses = clsx(
    "block h-full w-full", // parent controls the box size
    coverFit === "contain" ? "object-contain" : "object-cover",
    {
      "object-left": coverPosition === "left",
      "object-right": coverPosition === "right",
      "object-top": coverPosition === "top",
      "object-center": coverPosition === "center",
    }
  );

  // 3. --- Render -------------------------------------------------------------
  return (
    <section
      className={clsx(
        "relative overflow-hidden bg-white dark:bg-black",
        "before:pointer-events-none before:absolute before:inset-0",
        "before:bg-[radial-gradient(80%_60%_at_50%_0%,rgba(212,175,55,.14),transparent_60%)]",
        "dark:before:bg-[radial-gradient(80%_60%_at_50%_0%,rgba(212,175,55,.22),transparent_60%)]"
      )}
      role="region"
      aria-label="Featured content section"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-2 md:gap-12 md:py-16">
        {/* LEFT: copy -------------------------------------------------------- */}
        <div className="relative z-[1]">
          {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}

          <h1
            id="hero-title"
            className="font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-semibold leading-[1.08] text-deepCharcoal dark:text-cream [text-wrap:balance]"
          >
            {title}
          </h1>

          {subtitle && (
            <p className="mt-4 max-w-prose text-[color:var(--color-on-secondary)] opacity-85 dark:text-[color:var(--color-on-primary)] dark:opacity-85">
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
                aria-label={
                  secondaryCta.ariaLabel || `Go to ${secondaryCta.label}`
                }
                className="rounded-full border border-lightGrey bg-warmWhite px-4 py-2 text-sm font-semibold text-deepCharcoal transition hover:brightness-[.98] focus:outline-none focus-visible:ring-2"
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT: visual media container ------------------------------------ */}
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
            <video
              className={mediaClasses}
              autoPlay
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
            <Image
              src={imgSrc}
              alt={title || "Hero image illustrating the page content"}
              // IMPORTANT: do NOT use fill – we size via CSS
              width={800}
              height={1200} // portrait-ish; actual box is controlled by classes
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
