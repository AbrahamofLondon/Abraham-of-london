// components/HeroSection.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

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
        "text-xs font-semibold uppercase tracking-wide",
        "text-deepCharcoal/80",
        "dark:border-lightGrey/60 dark:bg-black/60 dark:text-cream/85",
        className,
      )}
    >
      {children}
    </span>
  );
}

// --- Types -------------------------------------------------------------------

type Cta = { href: string; label: string; ariaLabel?: string };
type VideoSource = { src: string; type: string };

export type HeroAspectRatio = "book" | "wide" | "square" | "cover-wide";

type HeroProps = {
  title?: string;
  subtitle?: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;

  coverImage?: string | null;
  coverAspect?: HeroAspectRatio;
  coverFit?: "contain" | "cover";
  coverPosition?: "left" | "center" | "right" | "top";

  videoSources?: VideoSource[] | null;
  poster?: string | null;

  eyebrow?: string;
};

// --- Utilities ---------------------------------------------------------------

/** Normalises local vs absolute URLs. */
function normalizeLocal(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  const clean = src.replace(/^\/+/, "");
  return `/${clean}`;
}

/** Height clamp – stops the hero visual from becoming a skyscraper. */
function getAspectClass(aspect: HeroAspectRatio): string {
  switch (aspect) {
    case "square":
      return "h-[220px] sm:h-[260px] md:h-[300px] lg:h-[340px]";
    case "wide":
      return "h-[200px] sm:h-[230px] md:h-[260px] lg:h-[300px]";
    case "cover-wide":
      return "h-[180px] sm:h-[210px] md:h-[240px] lg:h-[280px]";
    case "book":
    default:
      return "h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px]";
  }
}

// --- Main Component ----------------------------------------------------------

export default function HeroSection({
  title = "Faith-rooted strategy for founders, boards, and leaders.",
  subtitle = "I work with leaders who refuse to outsource responsibility — men and women who carry real weight for families, organisations, and nations.",
  eyebrow = "Advisory & Consulting",
  primaryCta = {
    href: "/contact",
    label: "Request a consultation",
    ariaLabel: "Request a consultation",
  },
  secondaryCta = { href: "/events", label: "View upcoming salons" },

  coverImage,
  coverAspect = "book",
  coverFit = "contain",
  coverPosition = "center",

  videoSources = [],
  poster = null,
}: HeroProps) {
  // 1. Core data & fallbacks --------------------------------------------------
  const defaultImage = "/assets/images/abraham-of-london-banner.webp";
  const imgSrc = normalizeLocal(coverImage) ?? normalizeLocal(defaultImage)!;

  const hasVideo =
    Array.isArray(videoSources) && videoSources.length > 0;
  const posterSrc = normalizeLocal(poster) ?? imgSrc;

  // 2. Layout classes ---------------------------------------------------------
  const frameClasses = clsx(
    "relative overflow-hidden rounded-2xl shadow-lg shadow-black/20",
    "max-w-[520px] w-full mx-auto",
    getAspectClass(coverAspect),
    {
      "p-2 sm:p-3 md:p-4 bg-warmWhite border border-lightGrey/70":
        coverFit === "contain",
    },
  );

  const mediaClasses = clsx(
    "h-full w-full",
    coverFit === "contain" ? "object-contain" : "object-cover",
    {
      "object-left": coverPosition === "left",
      "object-right": coverPosition === "right",
      "object-top": coverPosition === "top",
      "object-center": coverPosition === "center",
    },
  );

  // 3. Render -----------------------------------------------------------------
  return (
    <section
      className={clsx(
        "relative overflow-hidden",
        "bg-white text-deepCharcoal",
        "dark:bg-black dark:text-cream",
        "before:pointer-events-none before:absolute before:inset-0",
        "before:bg-[radial-gradient(80%_60%_at_50%_0%,rgba(212,175,55,.14),transparent_60%)]",
        "dark:before:bg-[radial-gradient(80%_60%_at_50%_0%,rgba(212,175,55,.22),transparent_60%)]",
      )}
      role="region"
      aria-label="Featured content section"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 md:grid-cols-2 md:gap-14 md:py-16">
        {/* LEFT: copy -------------------------------------------------------- */}
        <div className="relative z-[1]">
          {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}

          <h1
            id="hero-title"
            className="font-serif text-[clamp(2.1rem,3.5vw,3.25rem)] font-semibold leading-[1.08] [text-wrap:balance]"
          >
            {title}
          </h1>

          {subtitle && (
            <p className="mt-4 max-w-prose text-sm sm:text-base text-slate-800/90 dark:text-slate-100/90">
              {subtitle}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {primaryCta && (
              <Link
                href={primaryCta.href}
                aria-label={
                  primaryCta.ariaLabel ?? `Go to ${primaryCta.label}`
                }
                className="aol-btn"
              >
                {primaryCta.label}
              </Link>
            )}

            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                aria-label={
                  secondaryCta.ariaLabel ?? `Go to ${secondaryCta.label}`
                }
                className="rounded-full border border-lightGrey bg-warmWhite px-4 py-2 text-sm font-semibold text-deepCharcoal transition hover:brightness-[.98] focus:outline-none focus-visible:ring-2 dark:border-cream/40 dark:bg-transparent dark:text-cream/90"
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT: visual media container ------------------------------------ */}
        <div className={frameClasses}>
          {coverFit === "cover" && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[1]
                         bg-[linear-gradient(to_bottom,rgba(0,0,0,0.30),transparent_35%,transparent_65%,rgba(0,0,0,0.25))]
                         dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.45),transparent_40%,transparent_60%,rgba(0,0,0,0.35))]"
            />
          )}

          {hasVideo ? (
            <video
              className={clsx("block", mediaClasses)}
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
                <source
                  key={s.src}
                  src={normalizeLocal(s.src)}
                  type={s.type}
                />
              ))}
            </video>
          ) : (
            <Image
              src={imgSrc}
              alt={title || "Hero image illustrating the page content"}
              width={800}
              height={1200} // portrait-ish; actual size controlled by CSS
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className={clsx("block rounded-xl", mediaClasses)}
            />
          )}
        </div>
      </div>

      {/* Decorative grid dots at the bottom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:18px_18px] dark:opacity-30"
      />
    </section>
  );
}