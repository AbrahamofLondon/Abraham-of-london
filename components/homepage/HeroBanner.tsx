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
  imageSrc?: string;
  imageAlt?: string;
}

export function HeroBanner({
  title,
  subtitle,
  ctaLabel = "Explore the work",
  ctaHref = "/",
  secondaryCtaLabel,
  secondaryCtaHref,
  imageSrc = "/assets/images/abraham-of-london-banner.webp",
  imageAlt = "Abraham of London hero banner",
}: HeroBannerProps): JSX.Element {
  return (
    <section className="relative overflow-hidden bg-warmWhite">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center">
        <div className="flex-1 space-y-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Abraham of London
          </p>
          <h1 className="text-3xl font-semibold text-deepCharcoal sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {ctaHref && (
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

        <div className="relative flex-1">
          <div className="relative h-64 w-full md:h-80">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              className="rounded-2xl object-cover shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroBanner;