import * as React from "react";
import Image from "next/image";
import Link from "next/link";

/** Small “eyebrow” pill used above the H1 */
function Eyebrow({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full",
        "border border-lightGrey/70 bg-warmWhite/70 px-3 py-1",
        "text-xs uppercase tracking-wide",
        "text-[color:var(--color-on-secondary)/0.7] dark:text-[color:var(--color-on-primary)/0.8]",
        className || "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

type HeroProps = {
  /** Main heading. If omitted, children can render custom content. */
  title?: string;
  /** Optional subcopy under the heading */
  subtitle?: string;
  /** Primary CTA */
  primaryCta?: { href: string; label: string; ariaLabel?: string };
  /** Secondary CTA (outline style) */
  secondaryCta?: { href: string; label: string; ariaLabel?: string };

  /** Optional cover art on the right */
  coverImage?: string | null;
  /** “book” (2/3), “wide” (16/9) or “square” (1/1) frame */
  coverAspect?: "book" | "wide" | "square";
  /** contain (for book covers) or cover (edge-to-edge) */
  coverFit?: "contain" | "cover";
  /** object position for the cover image */
  coverPosition?: "left" | "center" | "right";

  /** Optional eyebrow text above the H1 */
  eyebrow?: string;
};

function normalizeLocal(src?: string | null) {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  return src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;
}

export default function HeroSection({
  title = "When the System Breaks You: Finding Purpose in Pain",
  subtitle = "Win the only battle you fully control — the one inside your chest.",
  eyebrow = "Featured Insight",
  primaryCta = { href: "/downloads/Fathering_Without_Fear_Teaser-Mobile.pdf", label: "Get the free teaser" },
  secondaryCta = { href: "/blog", label: "Read the latest insights" },
  coverImage,
  coverAspect = "book",
  coverFit = "contain",
  coverPosition = "center",
}: HeroProps) {
  const aspectClass =
    coverAspect === "square"
      ? "aspect-[1/1]"
      : coverAspect === "wide"
      ? "aspect-[16/9]"
      : "aspect-[2/3]"; // book

  const fitClass = coverFit === "contain" ? "object-contain" : "object-cover";
  const posClass =
    coverPosition === "left"
      ? "object-left"
      : coverPosition === "right"
      ? "object-right"
      : "object-center";

  const fallback =
    coverImage ||
    "/assets/images/books/when-the-system-breaks-cover.jpg";

  const imgSrc = normalizeLocal(fallback)!;

  // extra padding/background when using contain to give a “frame”
  const framePadding = coverFit === "contain" ? "p-2 sm:p-3 md:p-4" : "";
  const frameBg = coverFit === "contain" ? "bg-warmWhite" : "bg-transparent";
  const frameBorder =
    coverFit === "contain" ? "border border-lightGrey/70" : "border border-transparent";

  return (
    <section
      className={[
        "relative overflow-hidden",
        // subtle gradient band and top glow; works in dark as well
        "bg-white dark:bg-black",
        "before:pointer-events-none before:absolute before:inset-0",
        "before:bg-[radial-gradient(80%_60%_at_50%_0%,rgba(212,175,55,.14),transparent_60%)]",
        "dark:before:bg-[radial-gradient(80%_60%_at_50%_0%,rgba(212,175,55,.22),transparent_60%)]",
      ].join(" ")}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-2 md:gap-12 md:py-16">
        {/* LEFT: copy */}
        <div className="relative z-[1]">
          {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}

          <h1 className="font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-semibold leading-[1.08] text-deepCharcoal dark:text-cream [text-wrap:balance]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-4 max-w-prose text-[color:var(--color-on-secondary)/0.85] dark:text-[color:var(--color-on-primary)/0.85]">
              {subtitle}
            </p>
          )}

          {/* CTAs */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {primaryCta && (
              <Link
                href={primaryCta.href}
                aria-label={primaryCta.ariaLabel || primaryCta.label}
                className="aol-btn"
                // aol-btn comes from globals.css; ring color handled via CSS var
              >
                {primaryCta.label}
              </Link>
            )}
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                aria-label={secondaryCta.ariaLabel || secondaryCta.label}
                className="rounded-full border border-lightGrey bg-warmWhite px-4 py-2 text-sm font-semibold text-deepCharcoal transition hover:brightness-[.98] focus:outline-none focus-visible:ring-2"
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT: cover visual */}
        <div
          className={[
            "relative w-full overflow-hidden rounded-2xl shadow-card",
            aspectClass,
            framePadding,
            frameBg,
            frameBorder,
          ].join(" ")}
        >
          {/* readability veil only if we’re using object-cover poster art */}
          {coverFit === "cover" && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[1]
                         bg-[linear-gradient(to_bottom,rgba(0,0,0,0.30),transparent_35%,transparent_65%,rgba(0,0,0,0.25))]
                         dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.45),transparent_40%,transparent_60%,rgba(0,0,0,0.35))]"
            />
          )}
          <Image
            src={imgSrc}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className={[fitClass, posClass].join(" ")}
          />
        </div>
      </div>

      {/* decorative grid dots */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:18px_18px] dark:opacity-30"
      />
    </section>
  );
}
