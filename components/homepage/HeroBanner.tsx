// components/homepage/HeroBanner.tsx — UPGRADED (AoL premium, canonical Button, no nested Link)
// NOTE: this component is UI only; keep it router-safe and brand-consistent.
import * as React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";

export interface HeroBannerProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  imageSrc?: string | null;
  imageAlt?: string | null;
  eyebrow?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  subtitle,
  eyebrow = "Abraham of London",
  ctaLabel = "Explore the work",
  ctaHref = "/",
  secondaryCtaLabel,
  secondaryCtaHref,
  imageSrc = "/assets/images/abraham-of-london-banner.webp",
  imageAlt = "Abraham of London hero banner",
}) => {
  const resolvedImageSrc =
    typeof imageSrc === "string" && imageSrc.trim().length > 0 ? imageSrc : "/assets/images/abraham-of-london-banner.webp";

  const hasImage = typeof resolvedImageSrc === "string" && resolvedImageSrc.length > 0;

  return (
    <section className="relative overflow-hidden bg-[color:var(--color-warmWhite)]">
      {/* subtle brand texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[color:var(--color-softGold)] blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[color:var(--color-primary)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center">
        {/* Copy column */}
        <div className="flex-1 space-y-6">
          <p className="text-xs uppercase tracking-[0.28em] text-gray-500">{eyebrow}</p>

          <h1 className="text-3xl font-semibold text-[color:var(--color-deepCharcoal)] sm:text-4xl lg:text-5xl">
            {title}
          </h1>

          {subtitle ? <p className="max-w-xl text-sm text-gray-600 sm:text-base">{subtitle}</p> : null}

          <div className="flex flex-wrap gap-3 pt-2">
            {ctaHref && ctaLabel ? (
              <Button href={ctaHref} size="lg" variant="primary" className="uppercase tracking-wide">
                {ctaLabel}
              </Button>
            ) : null}

            {secondaryCtaHref && secondaryCtaLabel ? (
              <Button
                href={secondaryCtaHref}
                size="lg"
                variant="secondary"
                className="uppercase tracking-wide"
              >
                {secondaryCtaLabel}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Image column */}
        <div className="relative flex-1">
          <div className="relative h-64 w-full md:h-80">
            {hasImage ? (
              <Image
                src={resolvedImageSrc}
                alt={imageAlt || "Abraham of London hero banner"}
                fill
                priority
                className="rounded-2xl object-cover shadow-lg shadow-black/20"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--color-deepCharcoal)] via-black to-[color:var(--color-primary)/0.35] shadow-lg shadow-black/20">
                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-softGold)/0.85]">
                  Abraham of London
                </span>
              </div>
            )}

            {/* premium frame */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;