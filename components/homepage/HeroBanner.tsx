// components/homepage/HeroBanner.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/Button";

export interface HeroBannerProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  imageSrc?: string | null;
  imageAlt?: string | null;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  subtitle,
  ctaLabel = "Explore the work",
  ctaHref = "/",
  secondaryCtaLabel,
  secondaryCtaHref,
  imageSrc = "/assets/images/abraham-of-london-banner.webp",
  imageAlt = "Abraham of London hero banner",
}) => {
  // Defensive: always end up with a usable image path or null
  const resolvedImageSrc =
    typeof imageSrc === "string" && imageSrc.trim().length > 0
      ? imageSrc
      : "/assets/images/abraham-of-london-banner.webp";

  const hasImage =
    typeof resolvedImageSrc === "string" && resolvedImageSrc.length > 0;

  return (
    <section className="relative overflow-hidden bg-warmWhite">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center">
        {/* Copy column */}
        <div className="flex-1 space-y-6">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
            Abraham of London
          </p>

          <h1 className="text-3xl font-semibold text-deepCharcoal sm:text-4xl lg:text-5xl">
            {title}
          </h1>

          {subtitle && (
            <p className="max-w-xl text-sm text-gray-600 sm:text-base">
              {subtitle}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {ctaHref && ctaLabel && (
              <Link href={ctaHref}>
                <Button size="lg" variant="primary">
                  {ctaLabel}
                </Button>
              </Link>
            )}

            {secondaryCtaHref && secondaryCtaLabel && (
              <Link href={secondaryCtaHref}>
                <Button size="lg" variant="ghost">
                  {secondaryCtaLabel}
                </Button>
              </Link>
            )}
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
              // Fallback gradient card if, for any reason, the image path is unusable
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-deepCharcoal via-black to-forest/40 shadow-lg shadow-black/20">
                <span className="text-xs uppercase tracking-[0.2em] text-softGold/80">
                  Abraham of London
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
